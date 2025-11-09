// App.tsx
import 'react-native-url-polyfill/auto';
import { registerGlobals } from '@livekit/react-native-webrtc';
import React from 'react'; // ❌ useEffect رو حذف کنید
import { NavigationContainer } from '@react-navigation/native';
import AppNavigation from './screens/Navigation';
import LoginScreen from './screens/LoginScreen';
import { ChatProvider, useChat } from './context/ChatContext';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet, // ❌ StyleSheet دیگه لازم نیست (مگر اینکه جای دیگه استفاده کنید)
  TextInput,
  Platform
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

// --- فونت‌ها ---
const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold'; // <-- این رو نگه دارید، لازمش داریم

// --- تنظیمات پیش‌فرض (اینا درستن و می‌مونن) ---
// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = {
  fontFamily: FONT_REGULAR,
  fontWeight: 'normal',
};
// @ts-ignore
Text.defaultProps.allowFontScaling = false;

// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = {
  fontFamily: FONT_REGULAR,
  fontWeight: 'normal',
};
// @ts-ignore
TextInput.defaultProps.allowFontScaling = false;

registerGlobals();
WebBrowser.maybeCompleteAuthSession();

function RootNavigator() {
  // ... (کد این بخش دست نخوره)
  const { user, isLoadingAuth } = useChat();
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      {user ? <AppNavigation /> : <LoginScreen />}
    </NavigationContainer>
  );
}


// --- ❌❌❌ کل این بخش‌ها باید حذف بشن ❌❌❌ ---
// let hasPatchedTextRender = false;
// 
// export default function App() {
//   useEffect(() => {
//     if (!hasPatchedTextRender) {
//       // ... کل کد پچ ...
//     }
//   }, []);
// ...
// }
// --- ❌❌❌ تا اینجا حذف شود ❌❌❌ ---


// ✅ این شکلی باید بشه:
export default function App() {
  return (
    <>
      <ChatProvider>
        <RootNavigator />
      </ChatProvider>
      <Toast />
    </>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});