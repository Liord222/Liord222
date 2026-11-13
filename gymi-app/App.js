// gymi as a phone app. The whole product is the web page in ../workout-app; this shell gives it a home on the phone:
// it loads the page from inside the app (no network needed), keeps the workout log in the phone's own storage,
// keeps the owner's Anthropic API key in the phone's secure storage for the coach, and answers the page's requests
// for haptics, a screen that stays awake, file export and the back button.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Shell from './src/Shell';
import { buildDocument } from './src/document';

const STORE = 'gymi:log:v1';
const KEY_NAME = 'gymi.anthropic.key';
const THEME = {
  light: { paper: '#F2F3F5', surface: '#FFFFFF', field: '#F2F3F5', ink: '#0E1116', ink2: '#4B5261', accent: '#2152E0', onAccent: '#FFFFFF', danger: '#D12D45' },
  dark: { paper: '#0B0C0F', surface: '#17191E', field: '#22252C', ink: '#F4F5F7', ink2: '#B4B9C4', accent: '#8DAEFF', onAccent: '#081230', danger: '#FF6B7D' },
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
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: json ? 'public.json' : 'public.comma-separated-values-text', dialogTitle: 'gymi' });
}

/* the shell's own texts, in the language the page is in */
const TEXT = {
  he: {
    title: 'החיבור של אילון', on: 'אילון מחובר. אפשר להחליף את המפתח או לנתק אותו.',
    off: 'מדביקים כאן מפתח API של Anthropic. הוא נשמר רק בטלפון הזה, באחסון המאובטח שלו, ונשלח רק ל-Anthropic. השימוש מחויב בחשבון Anthropic שלך.',
    field: 'מפתח API של Anthropic', replace: 'החלפת המפתח', save: 'שמירה וחיבור', remove: 'ניתוק אילון ומחיקת המפתח', close: 'סגירה',
  },
  en: {
    title: 'Eilon\'s connection', on: 'Eilon is connected. You can replace the key or disconnect it.',
    off: 'Paste an Anthropic API key here. It is kept only on this phone, in its secure storage, and is sent only to Anthropic. Usage is billed to your Anthropic account.',
    field: 'Anthropic API key', replace: 'Replace the key', save: 'Save and connect', remove: 'Disconnect Eilon and delete the key', close: 'Close',
  },
};

/* where the owner pastes the API key for the coach, replaces it or removes it */
function KeySheet({ open, hasKey, lang, c, onSave, onRemove, onClose }) {
  const [value, setValue] = useState('');
  useEffect(() => { if (open) setValue(''); }, [open]);
  const ok = value.trim().length >= 20, T = TEXT[lang] || TEXT.he;
  const rtl = lang === 'en' ? { writingDirection: 'ltr', textAlign: 'left' } : { writingDirection: 'rtl', textAlign: 'right' };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,10,14,0.45)' }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34, gap: 14 }}>
          <Text accessibilityRole="header" style={[rtl, { color: c.ink, fontSize: 26, fontWeight: '800' }]}>{T.title}</Text>
          <Text style={[rtl, { color: c.ink2, fontSize: 15, lineHeight: 22 }]}>
            {hasKey ? T.on : T.off}
          </Text>
          <TextInput
            testID="keyInput" value={value} onChangeText={setValue} placeholder="sk-ant-..." placeholderTextColor={c.ink2}
            secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel={T.field}
            style={{ height: 52, borderRadius: 16, paddingHorizontal: 16, backgroundColor: c.field, color: c.ink, fontSize: 16, textAlign: 'left' }}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const first = useRef(scheme);
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
    else if (m.type === 'haptic') (m.strong ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => {});
    else if (m.type === 'awake') (m.on ? activateKeepAwakeAsync('gymi') : deactivateKeepAwake('gymi')).catch(() => {});
    else if (m.type === 'export') exportFile(m.filename, String(m.data || '')).catch(() => {});
    else if (m.type === 'key-get' && typeof m.id === 'string') keyStore.get().catch(() => null).then((key) => { if (shell.current) shell.current.run('window.__gymiReply(' + JSON.stringify(m.id) + ',' + JSON.stringify(key || null) + ')'); });
    else if (m.type === 'key-edit') setKeyOpen(true);
    else if (m.type === 'lang') {
      setLang(m.lang === 'en' ? 'en' : 'he');
      /* the page says its language every time it starts, also after the system reloaded it: tell it whether a key is saved now */
      if (shell.current) shell.current.run('if(window.gymiCoach&&window.GYMI_COACH!==' + keyNow.current + ')window.gymiCoach(' + keyNow.current + ')');
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
