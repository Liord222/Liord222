// The page host in a browser (npx expo start --web): an iframe that speaks the same messages as the phone's web view.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function Shell({ html, onMessage, background }, ref) {
  const frame = useRef(null);
  useImperativeHandle(ref, () => ({ run: (js) => { const w = frame.current && frame.current.contentWindow; if (w) w.postMessage({ gymiRun: js }, '*'); } }), []);
  useEffect(() => {
    const on = (e) => {
      if (!frame.current || e.source !== frame.current.contentWindow || typeof e.data !== 'string') return;
      try { onMessage(JSON.parse(e.data)); } catch (err) { /* not ours */ }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [onMessage]);
  return <iframe ref={frame} title="gymi" srcDoc={html} style={{ border: 0, width: '100%', height: '100%', background }} />;
});
