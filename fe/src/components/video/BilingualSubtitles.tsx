import React, { useEffect, useMemo, useRef, useState } from 'react';

export type DisplayMode = 'both' | 'en' | 'vi';

export interface BilingualCue {
  start: number;
  end: number;
  source: string;
  target: string;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  cues: BilingualCue[];
  mode?: DisplayMode;
  visible?: boolean;
}

const BilingualSubtitles: React.FC<Props> = ({ videoRef, cues, mode = 'both', visible = true }) => {
  const [activeText, setActiveText] = useState<{ en: string; vi: string }>({ en: '', vi: '' });
  const rafRef = useRef<number | null>(null);

  const sortedCues = useMemo(() => {
    return [...cues].sort((a, b) => a.start - b.start);
  }, [cues]);

  useEffect(() => {
    if (!visible) {
      setActiveText({ en: '', vi: '' });
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      const t = video.currentTime;
      // binary search could be used; linear is fine for small sizes
      const cue = sortedCues.find((c) => t >= c.start && t <= c.end);
      if (cue) {
        setActiveText({ en: cue.source, vi: cue.target });
      } else {
        setActiveText({ en: '', vi: '' });
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [videoRef, visible, sortedCues]);

  if (!visible) return null;

  const lines: string[] = [];
  if (mode === 'both') {
    if (activeText.en) lines.push(activeText.en);
    if (activeText.vi) lines.push(activeText.vi);
  } else if (mode === 'en') {
    if (activeText.en) lines.push(activeText.en);
  } else if (mode === 'vi') {
    if (activeText.vi) lines.push(activeText.vi);
  }

  if (lines.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 bottom-6 flex justify-center px-4"
      style={{ textShadow: '0 0 3px rgba(0,0,0,0.7)' }}
    >
      <div
        className="inline-block max-w-[90%] bg-black/40 text-white rounded px-3 py-2 text-center leading-relaxed"
      >
        {lines.map((l, i) => (
          <div key={i} className={i === 0 ? 'font-semibold' : 'mt-1 opacity-95'}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BilingualSubtitles;
