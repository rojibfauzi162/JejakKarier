
import { TrackingConfig } from "../types";
import { auth } from "./firebase";

/**
 * Service untuk menangani Injeksi Script Tracking & Event Pixel secara dinamis.
 * Mendukung Meta Pixel, Google Analytics (GA4), dan TikTok Pixel.
 */
class TrackingService {
  private config: TrackingConfig | null = null;
  private injectedPlatforms: Set<string> = new Set();
  private eventQueue: { eventName: any; data?: any; context?: any }[] = [];

  public init(config: TrackingConfig) {
    console.log("[TRACKING] init() called. metaPixelId:", config.metaPixelId || 'MISSING');
    this.config = config;
    if (typeof window === "undefined") return;
    this.injectScripts();
    this.processQueue();
  }

  private processQueue() {
    if (this.eventQueue.length > 0) {
      this.eventQueue.forEach(item => {
        this.trackEvent(item.eventName, item.data, item.context);
      });
      this.eventQueue = [];
    }
  }

  private injectScripts() {
    try {
      if (!this.config) {
        console.warn("[TRACKING] No config available for injection");
        return;
      }
      console.log("[TRACKING] injectScripts() starting with config:", JSON.stringify(this.config));

    // 1. Google Analytics (GA4)
    if (this.config.googleAnalyticsId && !this.injectedPlatforms.has('ga4_' + this.config.googleAnalyticsId)) {
      console.log("[TRACKING] Injecting GA4:", this.config.googleAnalyticsId);
      const gaId = this.config.googleAnalyticsId;
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
      
      this.injectedPlatforms.add('ga4_' + gaId);
    }

    // 2. Meta Pixel (Facebook)
    if (this.config.metaPixelId && !this.injectedPlatforms.has('meta_' + this.config.metaPixelId)) {
      const pixelId = this.config.metaPixelId;
      console.log("[TRACKING] Injecting Meta Pixel ID:", pixelId);
      
      if (!(window as any).fbq) {
        console.log("[TRACKING] window.fbq not found, initializing snippet...");
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return; n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
          };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
          n.queue = []; t = b.createElement(e); t.async = !0;
          t.src = v;
          t.onload = () => console.log("[TRACKING] Meta Pixel script (fbevents.js) loaded successfully.");
          t.onerror = () => console.error("[TRACKING] Failed to load Meta Pixel script (fbevents.js). Check AdBlocker!");
          b.head.appendChild(t);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      } else {
        console.log("[TRACKING] window.fbq already exists, skipping snippet initialization.");
      }
      
      try {
        console.log("[TRACKING] Calling fbq('init', ...)");
        (window as any).fbq('init', pixelId);
        console.log("[TRACKING] Calling fbq('track', 'PageView')");
        (window as any).fbq('track', 'PageView');
        console.log("[TRACKING] Meta Pixel initialization sequence complete.");
      } catch (e) {
        console.error("[TRACKING] Meta Pixel init error:", e);
      }
      
      this.injectedPlatforms.add('meta_' + pixelId);
    }

    // 3. TikTok Pixel
    if (this.config.tiktokPixelId && !this.injectedPlatforms.has('tiktok_' + this.config.tiktokPixelId)) {
      console.log("[TRACKING] Injecting TikTok Pixel:", this.config.tiktokPixelId);
      const tiktokId = this.config.tiktokPixelId;
      
      (function (w: any, d: any, t: string) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t: any,e: any){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t: any){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e: any,n: any){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];if(a && a.parentNode) a.parentNode.insertBefore(o,a)};
        ttq.load(tiktokId);
        ttq.page();
      })(window, document, 'ttq');
      
      this.injectedPlatforms.add('tiktok_' + tiktokId);
    }
    } catch (err) {
      console.error("[TRACKING] Critical error in injectScripts:", err);
    }
  }

  /**
   * Menembak event tracking ke seluruh platform yang terkonfigurasi.
   * @param eventName Nama event standar (PageView, ViewContent, AddToCart, CompleteRegistration, Lead, InitiateCheckout, AddPaymentInfo, Purchase)
   * @param data Data tambahan (value, currency, dll)
   */
  public async trackEvent(
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'CompleteRegistration' | 'Lead' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase' | string, 
    data?: any,
    context?: 'landingPageLoad' | 'selectPlanClick' | 'checkoutLoad' | 'registrationSuccess'
  ) {
    if (typeof window === "undefined") return;

    // Jika belum di-init atau config belum ada, masukkan ke antrian
    if (!this.config) {
      this.eventQueue.push({ eventName, data, context });
      return;
    }

    // Jika config ada tapi fbq belum siap (mungkin script masih loading), antrikan juga sementara
    if (this.config.metaPixelId && !(window as any).fbq) {
      this.eventQueue.push({ eventName, data, context });
      // Coba proses queue lagi setelah 500ms
      setTimeout(() => this.processQueue(), 500);
      return;
    }

    let finalEventName = eventName;
    if (this.config.eventMapping && context) {
      if (context === 'landingPageLoad' && this.config.eventMapping.landingPageLoad) {
        finalEventName = this.config.eventMapping.landingPageLoad;
      } else if (context === 'selectPlanClick' && this.config.eventMapping.selectPlanClick) {
        finalEventName = this.config.eventMapping.selectPlanClick;
      } else if (context === 'checkoutLoad' && this.config.eventMapping.checkoutLoad) {
        finalEventName = this.config.eventMapping.checkoutLoad;
      } else if (context === 'registrationSuccess' && this.config.eventMapping.registrationSuccess) {
        finalEventName = this.config.eventMapping.registrationSuccess;
      }
    }

    // Meta Pixel Event Mapping
    if ((window as any).fbq) {
      const eventId = data?.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const trackingData = { ...data };
      
      // Include test_event_code if available in config for easier debugging in Meta Events Manager
      if (this.config?.metaTestCode) {
        trackingData.test_event_code = this.config.metaTestCode;
      }

      console.log(`[TRACKING] Sending Meta Pixel event: ${finalEventName}`, trackingData, { eventID: eventId });
      
      try {
        // Standard Meta Pixel track call with eventID for deduplication with CAPI
        (window as any).fbq('track', finalEventName, trackingData, { eventID: eventId });
        
        // Pass the same eventId to CAPI if applicable
        if (data) data.event_id = eventId;
        else data = { event_id: eventId };
      } catch (e) {
        console.error(`[TRACKING] Error calling fbq('track', '${eventName}'):`, e);
      }
    } else {
      console.warn(`[TRACKING] Cannot send Meta Pixel event: ${eventName}. window.fbq is missing.`);
    }

    // Meta Conversion API (CAPI) - Untuk event bernilai tinggi (Purchase, Lead, CompleteRegistration)
    const capiEvents = ['Purchase', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'ViewContent'];
    if (capiEvents.includes(finalEventName) && this.config?.metaPixelId && this.config?.metaConversionAccessToken) {
      this.trackMetaCAPI(finalEventName, data);
    }

    // Google Analytics Event Mapping
    if ((window as any).gtag) {
      let gaEvent: string = eventName;
      switch (eventName) {
        case 'InitiateCheckout': gaEvent = 'begin_checkout'; break;
        case 'Purchase': gaEvent = 'purchase'; break;
        case 'PageView': gaEvent = 'page_view'; break;
        case 'ViewContent': gaEvent = 'view_item'; break;
        case 'AddToCart': gaEvent = 'add_to_cart'; break;
        case 'CompleteRegistration': gaEvent = 'sign_up'; break;
        case 'Lead': gaEvent = 'generate_lead'; break;
        case 'AddPaymentInfo': gaEvent = 'add_payment_info'; break;
      }
      (window as any).gtag('event', gaEvent, data);
    }

    // TikTok Event Mapping
    if ((window as any).ttq) {
      let ttEvent: string = eventName;
      switch (eventName) {
        case 'Purchase': ttEvent = 'CompletePayment'; break;
        case 'InitiateCheckout': ttEvent = 'InitiateCheckout'; break;
        case 'AddToCart': ttEvent = 'AddToCart'; break;
        case 'CompleteRegistration': ttEvent = 'CompleteRegistration'; break;
        case 'ViewContent': ttEvent = 'ViewContent'; break;
      }
      (window as any).ttq.track(ttEvent, data);
    }
  }

  /**
   * Mengirim event ke Meta Conversion API (CAPI) dari client-side.
   * Catatan: Idealnya ini dilakukan di server-side untuk keamanan Access Token.
   */
  private async trackMetaCAPI(eventName: string, data?: any) {
    if (!this.config?.metaPixelId || !this.config?.metaConversionAccessToken) {
      console.warn("[TRACKING] Meta CAPI skipped: Missing Pixel ID or Access Token");
      return;
    }

    console.log(`[TRACKING] Sending Meta CAPI event: ${eventName}`, data);
    try {
      const pixelId = this.config.metaPixelId;
      const accessToken = this.config.metaConversionAccessToken;
      const testCode = this.config.metaTestCode;

      // Ambil data user dari localStorage atau Firebase Auth
      const pendingReg = localStorage.getItem('pending_registration');
      let userData = pendingReg ? JSON.parse(pendingReg) : null;

      if (!userData && auth.currentUser) {
        userData = {
          email: auth.currentUser.email,
          name: auth.currentUser.displayName,
          phone: (auth.currentUser as any).phoneNumber || ""
        };
      }

      const payload: any = {
        data: [
          {
            event_name: eventName,
            event_id: data?.event_id,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: window.location.href,
            user_data: {
              client_ip_address: "", // Browser tidak bisa ambil IP publik langsung tanpa API eksternal
              client_user_agent: navigator.userAgent,
            },
            custom_data: {
              value: data?.value || 0,
              currency: data?.currency || "IDR",
              content_ids: data?.content_ids || (data?.content_id ? [data.content_id] : []),
              content_name: data?.content_name || "",
              content_type: "product",
            }
          }
        ]
      };

      if (testCode) {
        payload.test_event_code = testCode;
      }

      // Hash data sensitif jika tersedia
      if (userData) {
        if (userData.email) payload.data[0].user_data.em = [await this.hashData(userData.email)];
        if (userData.phone) payload.data[0].user_data.ph = [await this.hashData(userData.phone)];
        if (userData.name) payload.data[0].user_data.fn = [await this.hashData(userData.name)];
      }

      await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Meta CAPI Error:", err);
    }
  }

  private async hashData(data: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(data.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public getStatus() {
    return {
      meta: !!(window as any).fbq,
      ga4: !!(window as any).gtag,
      tiktok: !!(window as any).ttq,
      config: !!this.config,
      metaPixelId: this.config?.metaPixelId || 'None'
    };
  }

  public debug() {
    console.log("=== TRACKING SERVICE DEBUG ===");
    console.log("Config Loaded:", !!this.config);
    if (this.config) {
      console.log("Meta Pixel ID:", this.config.metaPixelId || "MISSING");
      console.log("Meta CAPI Token:", this.config.metaConversionAccessToken ? "PRESENT" : "MISSING");
      console.log("GA4 ID:", this.config.googleAnalyticsId || "MISSING");
      console.log("TikTok ID:", this.config.tiktokPixelId || "MISSING");
    }
    console.log("Injected Platforms:", Array.from(this.injectedPlatforms));
    console.log("window.fbq exists:", !!(window as any).fbq);
    console.log("window.gtag exists:", !!(window as any).gtag);
    console.log("window.ttq exists:", !!(window as any).ttq);
    console.log("==============================");
  }
}

export const trackingService = new TrackingService();
if (typeof window !== 'undefined') {
  (window as any).trackingService = trackingService;
}
