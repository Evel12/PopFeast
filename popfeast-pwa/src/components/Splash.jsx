import React, { useEffect, useState } from 'react';
import { Popcorn } from 'lucide-react';

export default function Splash({ onDone }){
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const start = performance.now();
    const step = () => {
      p = Math.min(100, p + Math.random() * 1.6 + 0.4); // even slower, smoother increments
      setProgress(p);
      if (p < 100) {
        requestAnimationFrame(step);
      } else {
        const elapsed = performance.now() - start;
        const minDuration = 3200; // minimum display time (~3.2s)
        const remaining = Math.max(0, minDuration - elapsed);
        const t = setTimeout(() => onDone && onDone(), remaining);
        return () => clearTimeout(t);
      }
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash-inner">
        <div className="splash-logo popcorn-icon"><Popcorn size={44} strokeWidth={1.6} /></div>
        <div className="splash-title">PopFeast</div>
        <div className="popcorn-row">
          <div className="popcorn-kernel" />
          <div className="popcorn-kernel" />
          <div className="popcorn-kernel" />
        </div>
        <div className="splash-bar"><div className="splash-bar-fill" style={{width: `${Math.round(progress)}%`}} /></div>
        <div className="splash-progress">{Math.round(progress)}%</div>
      </div>
    </div>
  );
}
