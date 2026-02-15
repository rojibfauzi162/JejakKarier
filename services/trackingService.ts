
import { TrackingConfig } from "../types";

/**
 * Service untuk menangani Injeksi Script Tracking & Event Pixel secara dinamis.
 * Mendukung Meta Pixel, Google Analytics (GA4), dan TikTok Pixel.
 */
class TrackingService {
  private config: TrackingConfig | null = null;
  private scriptsInjected = false;

  public init(config: TrackingConfig) {
    this.config = config;
    if (typeof window === "undefined") return;
    this.injectScripts();
  }

  private injectScripts() {
    if (this.scriptsInjected || !this.config) return;

    // 1. Google Analytics (GA4)
    if (this.config.googleAnalyticsId) {
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
    }

    // 2. Meta Pixel (Facebook)
    if (this.config.metaPixelId) {
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
    }

    // 3. TikTok Pixel
    if (this.config.tiktokPixelId) {
      const tiktokInit = document.createElement("script");
      tiktokInit.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${this.config.tiktokPixelId}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(tiktokInit);
    }

    this.scriptsInjected = true;
  }

  /**
   * Menembak event tracking ke seluruh platform yang terkonfigurasi.
   * @param eventName Nama event standar (PageView, InitiateCheckout, Purchase)
   * @param data Data tambahan (value, currency, dll)
   */
  public trackEvent(eventName: 'PageView' | 'InitiateCheckout' | 'Purchase', data?: any) {
    if (typeof window === "undefined") return;

    // Meta Event Mapping
    if ((window as any).fbq) {
      (window as any).fbq('track', eventName, data);
    }

    // Google Analytics Event Mapping
    if ((window as any).gtag) {
      const gaEvent = eventName === 'InitiateCheckout' ? 'begin_checkout' : 
                     eventName === 'Purchase' ? 'purchase' : 'page_view';
      (window as any).gtag('event', gaEvent, data);
    }

    // TikTok Event Mapping
    if ((window as any).ttq) {
      const ttEvent = eventName === 'Purchase' ? 'CompletePayment' : eventName;
      (window as any).ttq.track(ttEvent, data);
    }
  }
}

export const trackingService = new TrackingService();
