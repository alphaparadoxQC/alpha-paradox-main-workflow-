import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile" | "book" | "music.song" | "music.album" | "music.playlist" | "music.radio_station" | "video.movie" | "video.episode" | "video.tv_show" | "video.other";
  structuredData?: Record<string, any>;
}

export function SEO({
  title = "Alpha ParadoxQC — Quantum Computing in Your Browser",
  description = "Build, simulate, and run quantum circuits on real hardware. Drag-and-drop design to QPUs — free, no SDK required.",
  canonical,
  ogImage = "/quantum_simulator.png",
  ogType = "website",
  structuredData,
}: SEOProps) {
  const siteUrl = "https://alphaparadoxqc.com";
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;
  
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical Link */}
      {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={imageUrl} />
      {canonical && <meta property="og:url" content={`${siteUrl}${canonical}`} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
