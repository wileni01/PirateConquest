import { useEffect, useRef, useState } from "react";

export default function PerfOverlay() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("Perf: OFF");
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());
  const framesRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const on = params.get("perf") === "1" || params.get("perf") === "true";
    setVisible(on);
  }, []);

  useEffect(() => {
    if (!visible) return;
    function tick() {
      const now = performance.now();
      framesRef.current += 1;
      const dt = now - lastRef.current;
      if (dt >= 500) {
        const fps = (framesRef.current * 1000) / dt;
        setText(`FPS ${fps.toFixed(0)} | dt ${(dt / framesRef.current).toFixed(2)}ms`);
        framesRef.current = 0;
        lastRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', left: 8, bottom: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, border: '1px solid #444', borderRadius: 4, pointerEvents: 'none', zIndex: 9999 }}>
      {text}
    </div>
  );
}


