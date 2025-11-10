// src/styles/ChatScreen.styles.ts
import { StyleSheet, Platform, Dimensions } from 'react-native';

const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';

export const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
        marginBottom: 20, // (فضای خالی زیر لیست)
    },
    // --- حالت‌های لودینگ و خطا ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
        fontFamily: FONT_REGULAR,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        fontFamily: FONT_REGULAR,
    },
    // --- پیام خوشامدگویی ---
    welcomeContainer: {
        flex: 1,
        // ✅ 'justifyContent' را از 'center' به 'flex-start' تغییر دهید
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40, // ✅ کمی فاصله از بالا
    },
    welcomeLogo: {
        width: 150,
        height: 150,
        borderRadius: 16, // (اختیاری)
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: FONT_BOLD, // (از فونت بولد استفاده شد)
    },
    welcomeSubtitle: {
        fontSize: 18,
        color: '#8E8E93',
        textAlign: 'center',
        fontFamily: FONT_REGULAR,
    },
    // --- مدال تصویر ---
    imageModalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 60, // (فضای بیشتر از بالا)
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    fullScreenImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.7,
    },
    modalActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 60, // (فضای بیشتر از پایین)
        width: '80%',
        justifyContent: 'space-around',
    },
    modalActionButton: {
        // (استایل دکمه مدال)
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    modalActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: FONT_REGULAR,
        fontWeight: '600',
    },
});