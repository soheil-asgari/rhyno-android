// RhynoApp/screens/LoginScreen.tsx

import React, { useState, useEffect } from 'react'; // <-- useEffect اضافه شد
import {
    View,
    TextInput,
    Alert,
    StyleSheet,
    Text,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView,
    Pressable,
    Image
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import Icon from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';

// آدرس بک‌اند Next.js خود را اینجا وارد کنید
const YOUR_BACKEND_URL = 'https://www.rhynoai.ir';
const REDIRECT_SCHEME = 'rhynoapp://';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');

    // --- State های جدید برای تایمر ---
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    // --- افکت برای مدیریت تایمر شمارش معکوس ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTimerActive && otpSent) {
            interval = setInterval(() => {
                setTimer((prevTimer) => {
                    if (prevTimer === 1) {
                        clearInterval(interval!); // توقف تایمر
                        setIsTimerActive(false); // اجازه ارسال مجدد
                        return 0;
                    }
                    return prevTimer - 1; // کاهش ثانیه
                });
            }, 1000);
        }

        // تابع پاکسازی: در صورت unmount شدن یا توقف، اینتروال پاک می‌شود
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isTimerActive, otpSent]); // این افکت به این دو متغیر وابسته است

    // تابع ارسال OTP
    async function sendOtp() {
        if (!phone) {
            setError('لطفاً شماره موبایل را وارد کنید.');
            Toast.show({ type: 'error', text1: 'خطا', text2: 'لطفاً شماره موبایل را وارد کنید.' });
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${YOUR_BACKEND_URL}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone }),
            });

            const data = await res.json();

            if (data.success) {
                Toast.show({ type: 'success', text1: 'کد با موفقیت ارسال شد' });
                setOtpSent(true);
                setTimer(60); // <-- ریست کردن تایمر
                setIsTimerActive(true); // <-- فعال کردن تایمر
            } else {
                throw new Error(data.message || 'خطا در ارسال کد');
            }
        } catch (error: any) {
            setError(error.message);
            Toast.show({ type: 'error', text1: 'خطا', text2: error.message });
            console.error('خطا در ارسال کد:', error);
        }
        setLoading(false);
    }

    // --- تابع برای ارسال مجدد کد ---
    async function handleResend() {
        // به سادگی تابع ارسال اصلی را دوباره صدا می‌زنیم
        // این تابع به صورت خودکار loading و تایمر را مدیریت می‌کند
        await sendOtp();
    }

    // تابع تایید OTP
    async function verifyOtp() {
        if (!token) {
            setError('کد تایید را وارد کنید');
            Toast.show({ type: 'error', text1: 'خطا', text2: 'کد تایید را وارد کنید' });
            return;
        }
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${YOUR_BACKEND_URL}/api/mobile-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone, otp: token }),
            });

            const data = await res.json();

            if (data.access_token && data.refresh_token) {
                const { error } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                });

                if (error) {
                    throw new Error('خطا در تنظیم سشن: ' + error.message);
                }
            } else {
                throw new Error(data.message || 'کد تایید نادرست است');
            }
        } catch (error: any) {
            setError(error.message);
            Toast.show({ type: 'error', text1: 'خطا', text2: error.message });
            console.error('خطا در تایید کد:', error);
        }
        setLoading(false);
    }

    // تابع ورود با گوگل
    const handleGoogleSignIn = async () => {
        // ... (این تابع بدون تغییر باقی می‌ماند)
        setGoogleLoading(true);
        try {
            const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: REDIRECT_SCHEME,
                    skipBrowserRedirect: true,
                },
            });

            if (oauthError) throw oauthError;
            if (!data?.url) throw new Error("URL برای OAuth دریافت نشد.");

            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                REDIRECT_SCHEME
            );

            if (result.type === 'success' && result.url) {
                const url = result.url;
                const params = new URLSearchParams(url.split('#')[1]);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) {
                        throw new Error("خطا در تنظیم Session: " + sessionError.message);
                    }
                    console.log("ورود با گوگل موفقیت آمیز بود.");
                } else {
                    throw new Error("Token ها از URL بازگشتی دریافت نشدند.");
                }
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
                console.log("کاربر فرآیند ورود با گوگل را لغو کرد.");
            }

        } catch (error: any) {
            console.error("خطا در ورود با گوگل:", error);
            Alert.alert("خطا", "خطا در ورود با گوگل: " + error?.message);
            Toast.show({ type: 'error', text1: 'خطا در ورود با گوگل', text2: error.message });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.innerContainer}>

                    <Image source={require('../assets/icon.png')} style={styles.logo} />

                    <Text style={styles.header}>ورود یا ثبت‌نام در راینو</Text>

                    {!otpSent ? (
                        <>
                            <Text style={styles.subHeader}>
                                برای ادامه، شماره موبایل خود را وارد کنید
                            </Text>
                            <View style={styles.inputContainer}>
                                <Feather name="phone" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    onChangeText={(t) => { setPhone(t); setError(''); }}
                                    value={phone}
                                    placeholder="شماره موبایل (مثال: 0912...)"
                                    keyboardType="phone-pad"
                                    autoCapitalize="none"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton, (loading || googleLoading) && styles.buttonDisabled]}
                                onPress={sendOtp}
                                disabled={loading || googleLoading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {loading ? 'در حال ارسال...' : 'ادامه'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subHeader}>
                                کد ۶ رقمی ارسال شده به {phone} را وارد کنید
                            </Text>
                            <View style={styles.inputContainer}>
                                <Feather name="key" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    onChangeText={(t) => { setToken(t); setError(''); }}
                                    value={token}
                                    placeholder="کد تایید ۶ رقمی"
                                    keyboardType="number-pad"
                                    placeholderTextColor="#888"
                                />
                            </View>

                            {/* --- بخش جدید: تایمر و ارسال مجدد --- */}
                            <View style={styles.helperActionsContainer}>
                                {/* دکمه ویرایش شماره */}
                                <Pressable
                                    style={styles.editPhonePressable}
                                    onPress={() => {
                                        setOtpSent(false);
                                        setIsTimerActive(false); // توقف تایمر
                                        setError(''); // پاک کردن خطا
                                    }}
                                    disabled={loading} // غیرفعال هنگام لودینگ
                                >
                                    <Text style={styles.editPhoneText}>ویرایش شماره</Text>
                                </Pressable>

                                {/* تایمر یا دکمه ارسال مجدد */}
                                <View>
                                    {isTimerActive ? (
                                        <Text style={styles.timerText}>
                                            ارسال مجدد تا ({timer.toString().padStart(2, '0')})
                                        </Text>
                                    ) : (
                                        <Pressable onPress={handleResend} disabled={loading}>
                                            <Text style={styles.resendButtonText}>ارسال مجدد کد</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            {/* --- پایان بخش جدید --- */}

                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton, (loading || googleLoading) && styles.buttonDisabled]}
                                onPress={verifyOtp}
                                disabled={loading || googleLoading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {loading ? 'در حال بررسی...' : 'تایید و ورود'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* --- جدا کننده --- */}
                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>یا</Text>
                        <View style={styles.separatorLine} />
                    </View>

                    {/* --- دکمه ورود با گوگل --- */}
                    <TouchableOpacity
                        style={[styles.button, styles.googleButton, (loading || googleLoading) && styles.buttonDisabled]}
                        onPress={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
                                <Text style={styles.buttonText}>ادامه با گوگل</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        fontFamily: FONT_REGULAR,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 25,
        fontFamily: FONT_REGULAR,
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: FONT_BOLD,
    },
    subHeader: {
        fontSize: 16,
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: FONT_REGULAR,
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1C1C1E',
        borderRadius: 10,
        marginVertical: 12,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 55,
        color: '#fff',
        textAlign: Platform.OS === 'ios' ? 'right' : 'right',
        fontSize: 16,
        fontFamily: FONT_REGULAR,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 10,
        minHeight: 55,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONT_BOLD,
    },
    primaryButton: {
        backgroundColor: '#0A84FF',
        fontFamily: FONT_REGULAR,
    },
    secondaryButton: {
        backgroundColor: '#34C759',
        fontFamily: FONT_REGULAR,
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // --- استایل‌های جدید برای تایمر و ارسال مجدد ---
    helperActionsContainer: {
        flexDirection: 'row-reverse', // برای چیدمان راست به چپ
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 15,
        paddingHorizontal: 5, // کمی پدینگ افقی
    },
    editPhonePressable: {
        // می‌توانید استایل پدینگ برای راحتی کلیک اضافه کنید
        padding: 5,
    },
    editPhoneText: {
        color: '#0A84FF', // آبی لینک
        fontFamily: FONT_REGULAR,
        fontSize: 14,
    },
    timerText: {
        color: '#888', // خاکستری برای تایمر
        fontFamily: FONT_REGULAR,
        fontSize: 14,
    },
    resendButtonText: {
        color: '#34C759', // سبز برای ارسال مجدد
        fontFamily: FONT_BOLD, // بولد برای تاکید
        fontSize: 14,
    },
    // --- پایان استایل‌های جدید ---

    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 14,
        fontFamily: FONT_REGULAR,
    },
    googleButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 10,
        fontFamily: FONT_REGULAR,
    },
    googleIcon: {
        marginRight: 10,
    },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 14,
        fontFamily: FONT_REGULAR,
    },
});