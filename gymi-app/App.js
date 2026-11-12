// gymi as a phone app. The whole product is the web page in ../workout-app; this shell gives it a home on the phone:
// it loads the page from inside the app (no network needed), keeps the workout log in the phone's own storage,
// and answers the page's requests for haptics, a screen that stays awake, file export and the back button.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Shell from './src/Shell';
import { buildDocument } from './src/document';

const STORE = 'gymi:log:v1';
const PAPER = { light: '#F2F3F5', dark: '#0B0C0F' };

async function exportFile(filename, data) {
  const name = String(filename).replace(/[^\w.\-]/g, '_') || 'gymi-log.csv';
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'text/csv' })); a.download = name; a.click();
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(data);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'gymi' });
}

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const first = useRef(scheme);
  const shell = useRef(null);
  const [html, setHtml] = useState(null);

  /* read the phone's copy of the log, then build the page once */
  useEffect(() => {
    let on = true;
    AsyncStorage.getItem(STORE).catch(() => null).then((saved) => { if (on) setHtml(buildDocument(saved, first.current, Platform.OS)); });
    return () => { on = false; };
  }, []);

  /* light and dark follow the phone while the app is open */
  useEffect(() => {
    if (html && shell.current) shell.current.run("document.documentElement.setAttribute('data-theme'," + JSON.stringify(scheme) + ')');
  }, [scheme, html]);

  /* Android's back button closes what is open in the page; from the first screen it leaves the app */
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!shell.current) return false;
      shell.current.run("window.ReactNativeWebView.postMessage(JSON.stringify({type:'back',handled:!!(window.gymiBack&&window.gymiBack())}))");
      return true;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback((m) => {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'save' && typeof m.data === 'string') AsyncStorage.setItem(STORE, m.data).catch(() => {});
    else if (m.type === 'haptic') (m.strong ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => {});
    else if (m.type === 'awake') (m.on ? activateKeepAwakeAsync('gymi') : deactivateKeepAwake('gymi')).catch(() => {});
    else if (m.type === 'export') exportFile(m.filename, String(m.data || '')).catch(() => {});
    else if (m.type === 'back' && !m.handled) BackHandler.exitApp();
  }, []);

  const paper = PAPER[scheme];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: paper }} edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {html ? <Shell ref={shell} html={html} onMessage={onMessage} background={paper} /> : <View style={{ flex: 1, backgroundColor: paper }} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
