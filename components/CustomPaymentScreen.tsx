import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    // SafeAreaView, // ❌ حذف شد
    ScrollView,
    KeyboardAvoidingView,
    LayoutAnimation,
} from 'react-native';
// --- ✅ اصلاحیه ۱: ایمپورت صحیح SafeAreaView ---
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const YOUR_BACKEND_URL = 'https://www.rhynoai.ir';
const MINIMUM_AMOUNT = 100000;

const QuickAmountButton = ({
    amount,
    onSelect,
    isSelected,
}: {
    amount: number,
    onSelect: (amount: number) => void,
    isSelected: boolean,
}) => (
    <TouchableOpacity
        style={[styles.quickButton, isSelected && styles.quickButtonSelected]}
        onPress={() => onSelect(amount)}
    >
        <Text style={[styles.quickButtonText, isSelected && styles.quickButtonTextSelected]}>
            {amount.toLocaleString('fa-IR')} تومان
        </Text>
    </TouchableOpacity>
);

const CustomPaymentScreen = () => {
    const [amount, setAmount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation();

    const handleAmountChange = (text: string) => {
        if (error) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setError(null);
        }

        if (text === '') {
            setAmount(null);
            return;
        }

        const englishDigits = text
            .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728))
            .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632));

        const cleaned = englishDigits.replace(/[^0-9]/g, '');

        if (cleaned === '') {
            setAmount(null);
            return;
        }

        try {
            const numericValue = parseInt(cleaned, 10);
            setAmount(numericValue);
        } catch (e) {
            setAmount(null);
        }
    };

    const handleQuickSelect = (selectedAmount: number) => {
        if (error) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setError(null);
        }
        setAmount(selectedAmount);
    };

    const handlePaymentRequest = async () => {
        if (!amount || amount < MINIMUM_AMOUNT) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setError(`لطفاً یک مبلغ معتبر (حداقل ${MINIMUM_AMOUNT.toLocaleString('fa-IR')} تومان) وارد کنید.`);
            return;
        }

        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("لطفا ابتدا وارد حساب کاربری خود شوید.");

            const response = await fetch(`${YOUR_BACKEND_URL}/api/payment/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ amountToman: amount }),
            });

            const data = await response.json();

            if (!response.ok || data.message) {
                throw new Error(data.message || 'خطا در ایجاد لینک پرداخت.');
            }

            if (!data.paymentLink) {
                throw new Error('URL پرداخت از سرور دریافت نشد.');
            }

            const paymentUrl = data.paymentLink;
            const callbackUrl = 'rhynoapp://payment/status';
            const result = await WebBrowser.openAuthSessionAsync(paymentUrl, callbackUrl);

            if (result.type === 'success' || (result.type === 'opened' && Platform.OS === 'android')) {
                Alert.alert('پرداخت موفق', 'حساب شما با موفقیت شارژ شد.');
                setAmount(null);
                navigation.goBack();
            } else {
                Alert.alert('لغو شد', 'پرداخت توسط شما لغو شد.');
            }

        } catch (error: any) {
            Alert.alert('خطا', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // ✅ این SafeAreaView الان به درستی کار خواهد کرد
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>شارژ حساب</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ flexGrow: 1 }}
                    // --- ✅ اصلاحیه ۲: غلط املایی که باعث کرش می‌شد ---
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <Text style={styles.introText}>
                            مبلغ مورد نظر خود را انتخاب کنید یا به صورت دستی وارد نمایید.
                        </Text>

                        <Text style={styles.label}>مبلغ دلخواه</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={`حداقل ${MINIMUM_AMOUNT.toLocaleString('fa-IR')}`}
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={amount ? amount.toLocaleString('fa-IR') : ''}
                                onChangeText={handleAmountChange}
                                textAlign="right"
                            />
                            <Text style={styles.tomanLabel}>تومان</Text>
                        </View>

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <Text style={styles.quickLabel}>انتخاب سریع:</Text>
                        <View style={styles.quickContainer}>
                            <QuickAmountButton amount={100000} onSelect={handleQuickSelect} isSelected={amount === 100000} />
                            <QuickAmountButton amount={250000} onSelect={handleQuickSelect} isSelected={amount === 250000} />
                            <QuickAmountButton amount={500000} onSelect={handleQuickSelect} isSelected={amount === 500000} />
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, (isLoading || !amount || amount < MINIMUM_AMOUNT) && styles.buttonDisabled]}
                            onPress={handlePaymentRequest}
                            disabled={isLoading || !amount || amount < MINIMUM_AMOUNT}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>ادامه و پرداخت</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// (استایل‌ها بدون تغییر باقی می‌مانند)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#1C1C1E',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    introText: {
        fontSize: 15,
        color: '#AAAAAA',
        textAlign: 'right',
        marginBottom: 25,
        lineHeight: 22,
    },
    label: {
        fontSize: 16,
        color: '#AAAAAA',
        textAlign: 'right',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#3A3A3C',
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        paddingVertical: Platform.OS === 'ios' ? 16 : 12,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    tomanLabel: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
        marginLeft: 10,
    },
    errorText: {
        fontSize: 14,
        color: '#FF453A',
        textAlign: 'right',
        marginTop: 8,
        marginBottom: 10,
    },
    quickLabel: {
        fontSize: 16,
        color: '#AAAAAA',
        textAlign: 'right',
        marginBottom: 10,
        marginTop: 15,
    },
    quickContainer: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    quickButton: {
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginHorizontal: 4,
        alignItems: 'center',
        flex: 1,
        borderWidth: 2,
        borderColor: '#2C2C2E',
    },
    quickButtonSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF20',
    },
    quickButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    quickButtonTextSelected: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#555',
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CustomPaymentScreen;