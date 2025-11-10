// App.tsx
import 'react-native-url-polyfill/auto';
import { registerGlobals } from '@livekit/react-native-webrtc';
import React from 'react'; // ✅ useEffect حذف شد (استفاده نمی‌شد)
import { NavigationContainer } from '@react-navigation/native';
import AppNavigation from './screens/Navigation';
import LoginScreen from './screens/LoginScreen';
import { ChatProvider, useChat } from './context/ChatContext';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet, // (این می‌ماند چون styles.loadingContainer استفاده می‌شود)
  TextInput,
  // Platform, // ❌ حذف شد (استفاده نمی‌شد)
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { ActionSheetProvider } from '@expo/react-native-action-sheet'; // ✅ برای منوی گزینه‌ها لازم است
import LottieView from 'lottie-react-native';


// --- فونت‌ها ---
const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';

// --- تنظیمات پیش‌فرض (Global Font Settings) ---
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

/**
 * این کامپوننت روت اصلی ناوبری است
 * و بر اساس وضعیت لاگین، کاربر را به LoginScreen یا AppNavigation می‌فرستد
 */
function RootNavigator() {

  const { user, isLoadingAuth } = useChat();

  // نمایش لودینگ تا زمانی که وضعیت لاگین مشخص شود
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        {/* به جای ActivityIndicator از Lottie استفاده می‌کنیم */}
        <LottieView
          source={require('./assets/loading.json')} // 3. آدرس فایل انیمیشن
          autoPlay // اتوماتیک پخش شود
          loop // به صورت تکرارشونده پخش شود
          style={{ width: 200, height: 200 }} // 4. اندازه دلخواه خود را بدهید
        />
        {/* می‌توانید یک متن "در حال بارگذاری..." هم زیر انیمیشن اضافه کنید */}
        <Text style={{ color: '#fff', marginTop: 20 }}>در حال بارگذاری...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigation /> : <LoginScreen />}
    </NavigationContainer>
  );
}

// ✅ ساختار نهایی و صحیح App
export default function App() {
  return (
    // ActionSheetProvider کل برنامه را می‌پوشاند
    <ActionSheetProvider>
      {/* ما از یک Fragment <> استفاده می‌کنیم
              تا ActionSheetProvider فقط یک فرزند ببیند
            */}
      <>
        <ChatProvider>
          <RootNavigator />
        </ChatProvider>

        {/* Toast برای نمایش پیام‌های سراسری */}
        <Toast />
      </>
    </ActionSheetProvider>
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