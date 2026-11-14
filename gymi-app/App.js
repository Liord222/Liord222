// gymi as a phone app. The whole product is the web page in ../workout-app; this shell gives it a home on the phone:
// it loads the page from inside the app (no network needed), keeps the workout log in the phone's own storage,
// keeps the owner's Anthropic API key in the phone's secure storage for the coach, and answers the page's requests
// for haptics, a screen that stays awake, file export and the back button.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, I18nManager, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SplashScreen from 'expo-splash-screen';
import Shell from './src/Shell';
import { buildDocument } from './src/document';

/* the phone's own curtain stays up until the page has drawn its first screen, so the app never opens on an empty one */
SplashScreen.preventAutoHideAsync().catch(() => {});
try { if (typeof SplashScreen.setOptions === 'function') SplashScreen.setOptions({ fade: true, duration: 280 }); } catch (e) { /* older splash module */ }
let lifted = false;
const liftSplash = () => { if (lifted) return; lifted = true; SplashScreen.hideAsync().catch(() => {}); };

const STORE = 'gymi:log:v1';
/* the touch the page asks for, played by the phone's own engine */
const hapticOf = (kind) => {
  if (kind === 'select' || kind === 'step') return Haptics.selectionAsync();
  if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (kind === 'pr') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  if (kind === 'heavy') return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  if (kind === 'warn') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
const KEY_NAME = 'gymi.anthropic.key';
const THEME = {
  light: { paper: '#F5F5F8', surface: '#FFFFFF', field: '#F2F2F6', ink: '#0F0E14', ink2: '#4D4B58', accent: '#6D3FE0', onAccent: '#FFFFFF', danger: '#D12D45', head: '#5A2FCC' },
  dark: { paper: '#0B0A0F', surface: '#17161D', field: '#22212A', ink: '#F5F4F8', ink2: '#B8B5C4', accent: '#A98BFF', onAccent: '#1A0B3D', danger: '#FF6B7D', head: '#3B2477' },
};
/* the API key lives in the phone's keychain; the browser preview has none, so it falls back to plain storage there */
const keyStore = Platform.OS === 'web'
  ? { get: () => AsyncStorage.getItem(KEY_NAME), set: (v) => AsyncStorage.setItem(KEY_NAME, v), del: () => AsyncStorage.removeItem(KEY_NAME) }
  : { get: () => SecureStore.getItemAsync(KEY_NAME), set: (v) => SecureStore.setItemAsync(KEY_NAME, v), del: () => SecureStore.deleteItemAsync(KEY_NAME) };

async function exportFile(filename, data) {
  const name = String(filename).replace(/[^\w.\-]/g, '_') || 'gymi-log.csv', json = /\.json$/i.test(name), mime = json ? 'application/json' : 'text/csv';
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name; a.click();
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(data);
  /* a file left in the cache is no backup: with no way to hand it on, the page hears that it failed */
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing is not available');
  await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: json ? 'public.json' : 'public.comma-separated-values-text', dialogTitle: 'gymi' });
}

/* the shell's own texts, in the language the page is in */
const TEXT = {
  he: {
    title: 'החיבור של אילון', stateOn: 'מחובר', stateOff: 'לא מחובר',
    on: 'אילון מחובר ומוכן לעזור. אפשר להחליף את המפתח או לנתק אותו.',
    off: 'בינתיים אילון מתחבר עם מפתח API של Anthropic, וזה מיועד לבעל האפליקציה. בקרוב הוא יענה לכולם, בלי מפתח.',
    note: 'המפתח נשמר רק בטלפון הזה, באחסון המאובטח שלו, ונשלח רק ל-Anthropic. השימוש מחויב בחשבון Anthropic של בעל המפתח.',
    field: 'מפתח API של Anthropic', replace: 'החלפת המפתח', save: 'שמירה וחיבור', remove: 'ניתוק אילון ומחיקת המפתח', close: 'סגירה',
  },
  en: {
    title: 'Eilon\'s connection', stateOn: 'Connected', stateOff: 'Not connected',
    on: 'Eilon is connected and ready to help. You can replace the key or disconnect it.',
    off: 'For now Eilon connects with an Anthropic API key, which is meant for the owner of the app. Soon he will answer everyone, with no key.',
    note: 'The key is kept only on this phone, in its secure storage, and is sent only to Anthropic. Usage is billed to the Anthropic account of the key\'s owner.',
    field: 'Anthropic API key', replace: 'Replace the key', save: 'Save and connect', remove: 'Disconnect Eilon and delete the key', close: 'Close',
  },
};

/* where the owner pastes the API key for the coach, replaces it or removes it */
function KeySheet({ open, hasKey, lang, c, onSave, onRemove, onClose }) {
  const [value, setValue] = useState('');
  useEffect(() => { if (open) setValue(''); }, [open]);
  const ok = value.trim().length >= 20, T = TEXT[lang] || TEXT.he;
  /* in a right-to-left layout (a Hebrew phone) React Native swaps left and right in textAlign: ask for the side that lands where it should */
  const side = (s) => (I18nManager.isRTL ? (s === 'left' ? 'right' : 'left') : s);
  const rtl = lang === 'en' ? { writingDirection: 'ltr', textAlign: side('left') } : { writingDirection: 'rtl', textAlign: side('right') };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,7,22,0.6)' }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
          {/* a purple head, like the coach's own in the page: what this is, and whether he is connected */}
          <View style={{ backgroundColor: c.head, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: side(lang === 'en' ? 'left' : 'right') === 'left' ? 'flex-start' : 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)' }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: hasKey ? '#3DDC84' : '#B9B5C9' }} />
                <Text testID="keyState" style={{ color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' }}>{hasKey ? T.stateOn : T.stateOff}</Text>
              </View>
            </View>
            <Text accessibilityRole="header" style={[rtl, { color: '#FFFFFF', fontSize: 26, fontWeight: '800' }]}>{T.title}</Text>
            <Text style={[rtl, { color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 22 }]}>
              {hasKey ? T.on : T.off}
            </Text>
          </View>
          <View style={{ padding: 20, paddingBottom: 34, gap: 14 }}>
          <Text style={[rtl, { color: c.ink2, fontSize: 13.5, lineHeight: 20 }]}>{T.note}</Text>
          <TextInput
            testID="keyInput" value={value} onChangeText={setValue} placeholder="sk-ant-..." placeholderTextColor={c.ink2}
            secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel={T.field}
            style={{ height: 52, borderRadius: 16, paddingHorizontal: 16, backgroundColor: c.field, color: c.ink, fontSize: 16, textAlign: side('left') }}
          />
          <Pressable testID="keySave" accessibilityRole="button" disabled={!ok} onPress={() => onSave(value.trim())} style={{ height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent, opacity: ok ? 1 : 0.4 }}>
            <Text style={{ color: c.onAccent, fontSize: 18, fontWeight: '700' }}>{hasKey ? T.replace : T.save}</Text>
          </Pressable>
          {hasKey ? (
            <Pressable testID="keyRemove" accessibilityRole="button" onPress={onRemove} style={{ height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.field }}>
              <Text style={{ color: c.danger, fontSize: 16, fontWeight: '600' }}>{T.remove}</Text>
            </Pressable>
          ) : null}
          <Pressable testID="keyClose" accessibilityRole="button" onPress={onClose} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>{T.close}</Text>
          </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const first = useRef(scheme), schemeNow = useRef(scheme);
  schemeNow.current = scheme;
  const shell = useRef(null);
  const [html, setHtml] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const keyNow = useRef(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [lang, setLang] = useState('he');

  /* read the phone's copy of the log and whether a key is saved, then build the page once */
  useEffect(() => {
    let on = true;
    Promise.all([AsyncStorage.getItem(STORE).catch(() => null), keyStore.get().catch(() => null)]).then(([saved, key]) => {
      if (!on) return;
      keyNow.current = !!key; setHasKey(!!key); setHtml(buildDocument(saved, first.current, Platform.OS, !!key));
    });
    return () => { on = false; };
  }, []);

  /* the page says its language as soon as it starts; if it never does, the curtain still lifts */
  useEffect(() => { const t = setTimeout(liftSplash, 6000); return () => clearTimeout(t); }, []);

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

  const run = (js) => { if (shell.current) shell.current.run(js); };
  const coachState = (on) => { keyNow.current = on; setHasKey(on); setKeyOpen(false); run('window.gymiCoach&&window.gymiCoach(' + (on ? 'true' : 'false') + ')'); };

  const onMessage = useCallback((m) => {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'save' && typeof m.data === 'string') AsyncStorage.setItem(STORE, m.data).catch(() => {});
    else if (m.type === 'haptic') hapticOf(m.kind || (m.strong ? 'success' : 'tap')).catch(() => {});
    else if (m.type === 'awake') (m.on ? activateKeepAwakeAsync('gymi') : deactivateKeepAwake('gymi')).catch(() => {});
    else if (m.type === 'export') {
      const reply = (v) => { if (shell.current && typeof m.id === 'string') shell.current.run('window.__gymiReply(' + JSON.stringify(m.id) + ',' + JSON.stringify(v) + ')'); };
      exportFile(m.filename, String(m.data || '')).then(() => reply({ ok: true }), (e) => reply({ ok: false, error: String((e && e.message) || e) }));
    }
    else if (m.type === 'key-get' && typeof m.id === 'string') keyStore.get().catch(() => null).then((key) => { if (shell.current) shell.current.run('window.__gymiReply(' + JSON.stringify(m.id) + ',' + JSON.stringify(key || null) + ')'); });
    else if (m.type === 'key-edit') setKeyOpen(true);
    /* the account was deleted in the page: the key goes with it */
    else if (m.type === 'key-del') keyStore.del().catch(() => {}).then(() => coachState(false));
    else if (m.type === 'lang') {
      /* the page has started and drawn: a frame later the curtain lifts onto it */
      setTimeout(liftSplash, 60);
      setLang(m.lang === 'en' ? 'en' : 'he');
      /* the page says its language every time it starts, also after the system reloaded it: tell it whether a key is saved now */
      if (shell.current) shell.current.run('if(window.gymiCoach&&window.GYMI_COACH!==' + keyNow.current + ')window.gymiCoach(' + keyNow.current + ')');
      /* and the light or dark the phone is in now: a fresh web view starts from the theme of the launch */
      if (shell.current) shell.current.run("document.documentElement.setAttribute('data-theme'," + JSON.stringify(schemeNow.current) + ')');
    }
    else if (m.type === 'back' && !m.handled) BackHandler.exitApp();
  }, []);

  const c = THEME[scheme];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.paper }} edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {html ? <Shell ref={shell} html={html} onMessage={onMessage} background={c.paper} /> : <View style={{ flex: 1, backgroundColor: c.paper }} />}
        <KeySheet
          open={keyOpen} hasKey={hasKey} lang={lang} c={c} onClose={() => setKeyOpen(false)}
          onSave={(key) => keyStore.set(key).then(() => coachState(true)).catch(() => setKeyOpen(false))}
          onRemove={() => keyStore.del().catch(() => {}).then(() => coachState(false))}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
