import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function GoogleAnalytics() {
  const location = useLocation();
  const trackingId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

  useEffect(() => {
    if (!trackingId) return;

    // Load the script only once
    if (!document.getElementById("google-analytics-script")) {
      const script = document.createElement("script");
      script.id = "google-analytics-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", trackingId, {
        send_page_view: false, // We will handle page views manually
      });
    }
  }, [trackingId]);

  useEffect(() => {
    if (trackingId && window.gtag) {
      // Send page view on route change
      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, trackingId]);

  return null;
}
