// The page host on a phone: a web view that fills the screen.
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';

export default forwardRef(function Shell({ html, onMessage, background }, ref) {
  const web = useRef(null);
  /* a new number mounts a fresh web view: Android cannot reuse one whose render process is gone */
  const [life, setLife] = useState(0);
  useImperativeHandle(ref, () => ({ run: (js) => { if (web.current) web.current.injectJavaScript(js + ';true;'); } }), []);
  return (
    <WebView
      key={life}
      ref={web}
      source={{ html, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      onMessage={(e) => { try { onMessage(JSON.parse(e.nativeEvent.data)); } catch (err) { /* not ours */ } }}
      // The system may end the page's process while the app is in the background (memory). The log lives in the
      // page's own storage and in the phone's copy, so the page is simply loaded again instead of staying blank.
      onContentProcessDidTerminate={() => { if (web.current) web.current.reload(); }}
      onRenderProcessGone={() => setLife((n) => n + 1)}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      bounces={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures={false}
      allowsLinkPreview={false}
      // numbers in a training log are not phone numbers
      dataDetectorTypes="none"
      textZoom={100}
      style={{ flex: 1, backgroundColor: background }}
    />
  );
});
