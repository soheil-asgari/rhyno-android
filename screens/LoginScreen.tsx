// RhynoApp/screens/LoginScreen.tsx

import React, { useState } from 'react';
import {
    View,
    TextInput,
    Button,
    Alert,
    StyleSheet,
    Text,
    SafeAreaView, ActivityIndicator,
    Platform, TouchableOpacity
} from 'react-native';
import { supabase } from '../lib/supabase'; // ما هنوز برای setSession به این نیاز داریم
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Icon from 'react-native-vector-icons/AntDesign'

// آدرس بک‌اند Next.js خود را اینجا وارد کنید
const YOUR_BACKEND_URL = 'https://www.rhynoai.ir'; // <--- موقتاً http



export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    // تابع ارسال OTP (بر اساس PhoneLoginBox.tsx)
    async function sendOtp() {
        if (!phone) {
            Alert.alert('خطا', 'لطفاً شماره موبایل را وارد کنید.');
            return;
        }
        setLoading(true);

        try {
            // این API باید همان API در پروژه Next.js شما باشد
            // (این منطق را از 'PhoneLoginBox.tsx' شما گرفتم)
            const res = await fetch(`${YOUR_BACKEND_URL}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone }),
            });

            const data = await res.json();

            if (data.success) {
                Alert.alert('موفق', 'کد تایید به شماره شما ارسال شد.');
                setOtpSent(true);
            } else {
                throw new Error(data.message || 'خطا در ارسال کد');
            }
        } catch (error: any) {
            Alert.alert('خطا', error.message);
            console.error('خطا در ارسال کد:', error);
        }
        setLoading(false);
    }

    // تابع تایید OTP (با نیاز به تغییر در بک‌اند)
    async function verifyOtp() {
        if (!token) {
            Alert.alert('خطا', 'لطفاً کد تایید را وارد کنید.');
            return;
        }
        setLoading(true);

        try {
            // **نکته مهم:** این API باید تغییر کند تا session را برگرداند
            // ما از یک API جدید به نام '/api/mobile-verify' استفاده می‌کنیم
            const res = await fetch(`${YOUR_BACKEND_URL}/api/mobile-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone, otp: token }),
            });

            const data = await res.json();

            if (data.access_token && data.refresh_token) {
                // **موفقیت!** ما توکن‌ها را دریافت کردیم
                // حالا آن‌ها را در کلاینت Supabase موبایل ست می‌کنیم
                const { error } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                });

                if (error) {
                    throw new Error('خطا در تنظیم سشن: ' + error.message);
                }
                // اگر موفق باشد، onAuthStateChange در App.tsx
                // به صورت خودکار کاربر را به HomeScreen می‌برد.
            } else {
                throw new Error(data.message || 'کد تایید نادرست است');
            }
        } catch (error: any) {
            Alert.alert('خطا', error.message);
            console.error('خطا در تایید کد:', error);
        }
        setLoading(false);
    }
    const handleGoogleSignIn = async () => {
        const REDIRECT_SCHEME = Linking.createURL('/');
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
                    // Context هدایت می‌کند
                } else {
                    throw new Error("Token ها از URL بازگشتی دریافت نشدند.");
                }
            } else if (result.type === 'cancel' || result.type === 'dismiss') {
                console.log("کاربر فرآیند ورود با گوگل را لغو کرد.");
            } else {
                console.warn("نتیجه نامشخص از مرورگر:", result);
            }

        } catch (error: any) {
            console.error("خطا در ورود با گوگل:", error);
            Alert.alert("خطا", "خطا در ورود با گوگل: " + error?.message);
        } finally {
            setGoogleLoading(false);
        }
    };
    // ... (بخش return و styles بدون تغییر باقی می‌ماند)
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
                <Text style={styles.header}>ورود به راینو</Text>

                {/* --- بخش ورود با شماره موبایل --- */}
                {!otpSent ? (
                    <>
                        {/* ... TextInput شماره موبایل ... */}
                        <TextInput
                            style={styles.input}
                            onChangeText={setPhone}
                            value={phone}
                            placeholder="شماره موبایل (مثال: 0912...)"
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            placeholderTextColor="#888"
                        />
                        <View style={styles.buttonContainer}>
                            <Button
                                title={loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
                                disabled={loading || googleLoading}
                                onPress={sendOtp}
                                color="#0A84FF" // رنگ آبی
                            />
                        </View>
                    </>
                ) : (
                    <>
                        {/* ... TextInput کد تایید ... */}
                        <TextInput
                            style={styles.input}
                            onChangeText={setToken}
                            value={token}
                            placeholder="کد تایید ۶ رقمی"
                            keyboardType="number-pad"
                            placeholderTextColor="#888"
                        />
                        <View style={styles.buttonContainer}>
                            <Button
                                title={loading ? 'در حال بررسی...' : 'تایید و ورود'}
                                disabled={loading || googleLoading}
                                onPress={verifyOtp}
                                color="#34C759" // رنگ سبز
                            />
                        </View>
                    </>
                )}

                {/* --- جدا کننده --- */}
                <View style={styles.separatorContainer}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorText}>یا</Text>
                    <View style={styles.separatorLine} />
                </View>

                {/* --- دکمه ورود با گوگل --- */}
                {/* 👇 ۳. استفاده از TouchableOpacity برای استایل بهتر */}
                <TouchableOpacity
                    style={[styles.googleButton, (loading || googleLoading) && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                >
                    {googleLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>ورود با گوگل</Text>
                        </>
                    )}
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

// ... (استایل‌ها را از قدم قبلی کپی کنید)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // پس‌زمینه مشکی
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        height: 55, // کمی بلندتر
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#333', // کمی تیره‌تر
        backgroundColor: '#1C1C1E', // خاکستری خیلی تیره
        padding: 15,
        borderRadius: 10,
        color: '#fff',
        textAlign: Platform.OS === 'ios' ? 'right' : 'right',
        fontSize: 16,
    },
    buttonContainer: { // برای فاصله و گرد کردن دکمه‌های پیش‌فرض
        marginVertical: 10,
        borderRadius: 10, // گرد کردن
        overflow: 'hidden', // برای اعمال borderRadius روی Button در اندروید
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333', // تیره‌تر
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 14,
    },
    // دکمه گوگل
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4285F4', // رنگ آبی گوگل
        paddingVertical: 15, // بلندتر
        borderRadius: 10,
        marginTop: 10,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: { // استایل دکمه غیرفعال
        opacity: 0.6,
    },
});