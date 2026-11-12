// The page host on a phone: a web view that fills the screen.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WebView } from 'react-native-webview';

export default forwardRef(function Shell({ html, onMessage, background }, ref) {
  const web = useRef(null);
  useImperativeHandle(ref, () => ({ run: (js) => { if (web.current) web.current.injectJavaScript(js + ';true;'); } }), []);
  return (
    <WebView
      ref={web}
      source={{ html, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      onMessage={(e) => { try { onMessage(JSON.parse(e.nativeEvent.data)); } catch (err) { /* not ours */ } }}
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
      textZoom={100}
      style={{ flex: 1, backgroundColor: background }}
    />
  );
});
