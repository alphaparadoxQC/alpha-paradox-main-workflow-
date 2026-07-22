import { useEffect, useRef } from 'react';

/**
 * Full-bleed autoplay background video with poster fallback and a
 * configurable gradient scrim so headline text stays readable on
 * top of bright/busy footage.
 *
 * Perf: with 3 of these on one page, playing every video all the time
 * (even while scrolled far out of view) is the single biggest source of
 * lag — the browser keeps decoding 3 looping streams non-stop. An
 * IntersectionObserver here plays a video only while its section is
 * actually on screen and pauses it otherwise, and preload is set to
 * "metadata" so nothing starts downloading/decoding until needed.
 */
export default function VideoBackground({ src, poster, overlay = 'dark', children }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // play() returns a promise that can reject if the browser
            // interrupts it (e.g. rapid scroll) — swallow that safely.
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-media">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden="true"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={`bg-overlay overlay-${overlay}`} />
      <div className="bg-vignette" />
      {children}
    </div>
  );
}
