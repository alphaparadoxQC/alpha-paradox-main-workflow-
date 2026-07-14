# SEO & Analytics Setup Guide

This document outlines how SEO, metadata, and analytics are configured in the Alpha ParadoxQC project and how to update them.

## 1. Environment Variables

To enable full tracking and absolute URLs for SEO (like canonical links and Open Graph images), ensure your production environment has these variables set:

```env
VITE_SITE_URL=https://alphaparadoxqc.com
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## 2. Dynamic SEO Component

The project uses a custom `<SEO />` React component inside `src/components/SEO.tsx`. This component dynamically injects and updates metadata in the `<head>` of the document whenever a user navigates to a new route.

### Usage Example
In `src/App.tsx`, routes are wrapped with the SEO component:
```tsx
<Route path="/builder" element={
  <>
    <SEO 
      title="Circuit Builder | Alpha ParadoxQC" 
      description="Design and simulate quantum circuits visually." 
      url="/builder" 
    />
    <Index />
  </>
} />
```

### Adding Structured Data (Schema.org)
You can pass a `structuredData` prop (JSON object) to the SEO component for advanced rich snippets:
```tsx
<SEO 
  title="Home"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Alpha ParadoxQC",
    "url": "https://alphaparadoxqc.com"
  }}
/>
```

## 3. Sitemap & Robots.txt

- **robots.txt**: Located at `public/robots.txt`. It allows all web crawlers and provides the sitemap URL.
- **sitemap.xml**: Located at `public/sitemap.xml`. When you add new pages to the application, remember to manually update this file to reflect the new paths, priority, and change frequency.

## 4. Google Analytics Integration

Google Analytics 4 (GA4) is integrated via `src/components/GoogleAnalytics.tsx`.
- It dynamically loads the GA script only if `VITE_GOOGLE_ANALYTICS_ID` is present.
- It automatically tracks page views via React Router's `useLocation` hook when the route changes.

## 5. Pre-launch Production Checklist

Before the final launch, complete these manual steps:
1. **Update Domain Name**: Replace `https://alphaparadoxqc.com` in `public/robots.txt` and `public/sitemap.xml` with your actual production domain.
2. **Verify Google Search Console**: Add your domain to Google Search Console and verify ownership.
3. **Submit Sitemap**: In Google Search Console, submit your sitemap URL (`https://alphaparadoxqc.com/sitemap.xml`).
4. **Set Analytics ID**: Provide your actual Google Analytics Measurement ID in the production environment variables (`VITE_GOOGLE_ANALYTICS_ID`).
5. **Test Open Graph Tags**: Use tools like [Twitter Card Validator](https://cards-dev.twitter.com/validator) or [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to ensure social sharing cards appear correctly.
