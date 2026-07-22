import { useEffect, useRef, useState } from 'react';

/**
 * Procedural background used for sections that don't have a supplied
 * video asset. A faint grid + drifting glow keeps the cinematic,
 * research-lab atmosphere consistent with the video sections.
 *
 * Perf: there are 4 of these on the page (8 blurred, animating blobs
 * total). filter: blur(110px) is expensive to repaint every animation
 * frame, and by default the CSS animation keeps running even while the
 * section is scrolled far out of view. An IntersectionObserver toggles
 * a class that pauses the animation (and blur) whenever the section
 * isn't visible.
 */
export default function GridGlowBackground({ glow = 'center' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '200px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`bg-media designed-bg glow-${glow} ${visible ? 'glow-active' : ''}`}
      aria-hidden="true"
    >
      <div className="grid-layer" />
      <div className="glow-blob glow-a" />
      <div className="glow-blob glow-b" />
    </div>
  );
}
