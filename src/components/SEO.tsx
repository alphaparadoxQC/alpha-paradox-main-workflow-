import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
  structuredData?: Record<string, any>;
}

export function SEO({
  title = "Alpha ParadoxQC — Quantum Computing in Your Browser",
  description = "Build, simulate, and run quantum circuits on real hardware. Drag-and-drop design to IonQ & Rigetti QPUs — free, no PhD required.",
  name = "Alpha ParadoxQC",
  type = "website",
  image = "/quantum_simulator.png",
  url,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to set meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Update Standard Meta Tags
    setMetaTag("name", "description", description);
    setMetaTag("name", "author", name);

    // 3. Update Open Graph Meta Tags
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", type);
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
    setMetaTag("property", "og:image", imageUrl);
    setMetaTag("property", "og:url", url ? `${siteUrl}${url}` : window.location.href);

    // 4. Update Twitter Meta Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", imageUrl);

    // 5. Update Canonical URL
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url ? `${siteUrl}${url}` : window.location.href);

    // 6. Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector("script[type='application/ld+json']");
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.innerHTML = JSON.stringify(structuredData);
    }

    return () => {
      // Optional cleanup could go here, but usually, we want to leave the tags 
      // or overwrite them on the next route change.
    };
  }, [title, description, name, type, image, url, structuredData]);

  return null;
}
