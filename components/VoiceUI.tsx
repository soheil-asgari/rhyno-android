import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import InCallManager from 'react-native-incall-manager';
import { Audio } from 'expo-av';



interface VoiceUIProps {
    onStop: () => void;
    chatSettings: any;
    supabaseToken: string;
}

export const VoiceUI: React.FC<VoiceUIProps> = ({
    onStop,
    chatSettings,
    supabaseToken
}) => {

    const webViewRef = useRef<WebView>(null);
    useEffect(() => {
        // [اصلاح] ما 2 ثانیه صبر می‌کنیم تا به WebView فرصت دهیم
        // ابتدا اتصال WebRTC و getUserMedia را برقرار کند.
        const timerId = setTimeout(() => {
            console.log("🔊 [InCallManager] Starting... Forcing speaker. (After delay)");
            try {
                // حالت تماس را شروع می‌کند
                InCallManager.start({ media: 'audio' });
                // صدا را به زور روی بلندگو می‌اندازد
                InCallManager.setForceSpeakerphoneOn(true);
                // (اختیاری) صفحه را روشن نگه می‌دارد
                InCallManager.setKeepScreenOn(true);
            } catch (err: any) {
                console.error("InCallManager error:", err.message);
            }
        }, 2000); // <-- 2 ثانیه تاخیر

        // --- این تابع زمانی اجرا می‌شود که کامپوننت بسته می‌شود ---
        return () => {
            clearTimeout(timerId); // اگر کامپوننت زودتر بسته شد، تایمر را پاک کن
            console.log("🔇 [InCallManager] Stopping...");
            InCallManager.setKeepScreenOn(false);
            InCallManager.stop();
        };
    }, []); // <-- [] وابستگی خالی همچنان درست است
    // ✅ [اصلاح اصلی ۱: ساده‌سازی onMessage]
    // ما دیگر منتظر WEBVIEW_READY نیستیم.
    const handleWebViewMessage = (event: WebViewMessageEvent) => {
        const messageData = event.nativeEvent.data;
        console.log("Received message from WebView:", messageData);

        try {
            const data = JSON.parse(messageData);

            // فقط به پیام بستن گوش می‌ده"
            if (data.type === 'close-webview' || data.type === 'session-ended') {
                onStop();
            }
        } catch (e) {
            // نادیده گرفتن
        }
    };
    useEffect(() => {

        // این تابع "cleanup" (پاک‌سازی) است
        // این کد دقیقاً زمانی اجرا می‌شود که کامپوننت VoiceUI بسته شود (unmount شود)
        return () => {
            console.log("Cleaning up VoiceUI audio session...");

            // سیستم صوتی را به حالت "پخش" برگردان
            // این کار قفل میکروفون را آزاد می‌کند
            Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                // --- Android ---
                interruptionModeAndroid: 1, // 1 = InterruptionModeAndroid.DuckOthers (حالت پخش)
                shouldDuckAndroid: false,
                staysActiveInBackground: false,
                playThroughEarpieceAndroid: false,
            }).catch(err => {
                console.error("Failed to reset audio mode on VoiceUI cleanup:", err);
            });
        };
    }, []);
    const model = chatSettings.model || 'gpt-4o-realtime-preview';
    const cacheBuster = `&v=${Date.now()}`;
    const webAppUrl = `https://www.rhynoai.ir/chat/realtime?model=${model}${cacheBuster}`;
    console.log(webAppUrl);
    // ✅ [اصلاح اصلی ۲: تزریق مستقیم توکن]
    // این اسکریپت پس از لود شدن صفحه اجرا می‌شود و توکن را مستقیماً
    // روی آبجکت window در WebView قرار می‌دهد.
    const injectedJavaScript = `
      window.SUPABASE_ACCESS_TOKEN = '${supabaseToken}';
      true; //  باید true برگرداند
    `;
    console.log(injectedJavaScript)
    console.log(`🎙️ [VoiceUI] Preparing WebView and injecting token...`);

    return (
        <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity style={styles.closeButton} onPress={onStop}>
                <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <WebView
                ref={webViewRef}
                source={{ uri: webAppUrl }}
                style={styles.webView}

                onMessage={handleWebViewMessage} // <-- شنونده ساده‌شده
                injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
                // @ts-ignore 
                onPermissionRequest={(request: any) => {
                    console.log('WebView is requesting permission for:', request.permission);

                    // ما به سادگی تمام درخواست‌های مجوز از این WebView را می‌پذیریم
                    // (چون می‌دانیم که فقط درخواست میکروفون خواهد بود)
                    request.grant();
                }}
                originWhitelist={['https://*']}
                // ✅ [اصلاح اصلی ۳: استفاده از injectedJavaScript]
                // (نه BeforeContentLoaded)


                domStorageEnabled={true}
                javaScriptEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                allowFileAccess={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.content}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                    Alert.alert("خطا در بارگذاری", "صفحه چت صوتی بارگذاری نشد.", [{ text: "تایید", onPress: onStop }]);
                }}
            />
        </SafeAreaView>
    );
};

// ... (استایل‌ها بدون تغییر) ...
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    // ... (بقیه استایل‌ها) ...
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 20 : 60,
        right: 20,
        padding: 10,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 25,
    },
    webView: {
        flex: 1,
        backgroundColor: '#000',
    },
});