// The coach's camera button on Android. The page opens the phone's own camera app through the web view's file chooser.
// Android 11 and later hide other apps from this one unless the manifest says which kind it looks for, so the camera
// app is named here (a <queries> entry for IMAGE_CAPTURE). The app itself does not use the camera, so it does not ask for
// the CAMERA permission: an app that declares it without holding it is not allowed to start the camera app at all.
const { withAndroidManifest } = require('expo/config-plugins');

const CAPTURE = 'android.media.action.IMAGE_CAPTURE';

module.exports = function withCameraQuery(config) {
  return withAndroidManifest(config, (c) => {
    const m = c.modResults.manifest;
    if (!Array.isArray(m.queries) || !m.queries.length) m.queries = [{}];
    const q = m.queries[0];
    q.intent = Array.isArray(q.intent) ? q.intent : [];
    const has = q.intent.some((i) => (i.action || []).some((a) => a.$ && a.$['android:name'] === CAPTURE));
    if (!has) q.intent.push({ action: [{ $: { 'android:name': CAPTURE } }] });
    return c;
  });
};
