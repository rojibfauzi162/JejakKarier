
import { TrackingConfig } from "../types";

/**
 * Service untuk menangani Injeksi Script Tracking & Event Pixel secara dinamis.
 * Mendukung Meta Pixel, Google Analytics (GA4), dan TikTok Pixel.
 */
class TrackingService {
  private config: TrackingConfig | null = null;
  private injectedPlatforms: Set<string> = new Set();

  public init(config: TrackingConfig) {
    this.config = config;
    if (typeof window === "undefined") return;
    this.injectScripts();
  }

  private injectScripts() {
    if (!this.config) return;

    // 1. Google Analytics (GA4)
    if (this.config.googleAnalyticsId && !this.injectedPlatforms.has('ga4_' + this.config.googleAnalyticsId)) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
      document.head.appendChild(gaScript);

      const gaInit = document.createElement("script");
      gaInit.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.config.googleAnalyticsId}');
      `;
      document.head.appendChild(gaInit);
      this.injectedPlatforms.add('ga4_' + this.config.googleAnalyticsId);
    }

    // 2. Meta Pixel (Facebook)
    if (this.config.metaPixelId && !this.injectedPlatforms.has('meta_' + this.config.metaPixelId)) {
      const metaInit = document.createElement("script");
      metaInit.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${this.config.metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(metaInit);
      this.injectedPlatforms.add('meta_' + this.config.metaPixelId);
    }

    // 3. TikTok Pixel
    if (this.config.tiktokPixelId && !this.injectedPlatforms.has('tiktok_' + this.config.tiktokPixelId)) {
      const tiktokInit = document.createElement("script");
      tiktokInit.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${this.config.tiktokPixelId}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(tiktokInit);
      this.injectedPlatforms.add('tiktok_' + this.config.tiktokPixelId);
    }
  }

  /**
   * Menembak event tracking ke seluruh platform yang terkonfigurasi.
   * @param eventName Nama event standar (PageView, ViewContent, AddToCart, CompleteRegistration, Lead, InitiateCheckout, AddPaymentInfo, Purchase)
   * @param data Data tambahan (value, currency, dll)
   */
  public async trackEvent(
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'CompleteRegistration' | 'Lead' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase', 
    data?: any
  ) {
    if (typeof window === "undefined") return;

    // Meta Pixel Event Mapping
    if ((window as any).fbq) {
      (window as any).fbq('track', eventName, data);
    }

    // Meta Conversion API (CAPI) - Khusus untuk Purchase
    if (eventName === 'Purchase' && this.config?.metaPixelId && this.config?.metaConversionAccessToken) {
      this.trackMetaCAPI(eventName, data);
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
    if (!this.config?.metaPixelId || !this.config?.metaConversionAccessToken) return;

    try {
      const pixelId = this.config.metaPixelId;
      const accessToken = this.config.metaConversionAccessToken;
      const testCode = this.config.metaTestCode;

      // Ambil data user dari localStorage jika ada (disimpan saat registrasi/checkout)
      const pendingReg = localStorage.getItem('pending_registration');
      const userData = pendingReg ? JSON.parse(pendingReg) : null;

      const payload: any = {
        data: [
          {
            event_name: eventName,
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
}

export const trackingService = new TrackingService();
