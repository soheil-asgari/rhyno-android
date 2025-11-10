// screens/SettingsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Button,
    Alert,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../context/ChatContext';
import { supabase } from '../lib/supabase';
import { Tables } from '../supabase/types';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';


const MANUAL_EXCHANGE_RATE = 1030000;

const formatBalance = (balanceUSD: number) => {
    if (!balanceUSD || balanceUSD === 0) return "۰";
    const balanceIRR = balanceUSD * MANUAL_EXCHANGE_RATE;
    const balanceToman = balanceIRR / 10;
    const rounded = Math.floor(balanceToman);
    return rounded.toLocaleString("fa-IR");
};

const formatToken = (num: number) => {
    if (!num) return "۰";
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2) + " M";
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + " K";
    }
    return num.toString();
};

const formatCostToToman = (costUSD: number) => {
    if (!costUSD || costUSD === 0) return "۰";
    const balanceIRR = costUSD * MANUAL_EXCHANGE_RATE;
    const balanceToman = balanceIRR / 10;
    if (balanceToman < 1) {
        return balanceToman.toFixed(2);
    }
    if (balanceToman < 100) {
        return balanceToman.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
    }
    return balanceToman.toLocaleString("fa-IR", { maximumFractionDigits: 0 });
};

const MODEL_DISPLAY_NAMES: Record<string, string> = {
    "gpt-3.5-turbo": "💨 Rhyno V1",
    "gpt-3.5-turbo-16k": "💨 Rhyno V1 Pro",
    "gpt-4": "🧠 Rhyno V4",
    "gpt-4-turbo": "⚡ Rhyno V4 Turbo",
    "gpt-4-turbo-preview": "⚡ Rhyno V4 Preview",
    "gpt-4o": "🚀 Rhyno V4 Ultra",
    "gpt-4o-mini": "⚡ Rhyno V4 Mini",
    "gpt-4o-mini-tts": "🎤 Rhyno TTS",
    "gpt-4o-transcribe": "🎙️ Rhyno Transcribe",
    "computer-use-preview": "🖥️ Rhyno Auto",
    "gpt-5": "🌌 Rhyno V5 Ultra",
    "gpt-5-mini": "✨ Rhyno V5 Mini",
    "gpt-5-nano": "🔹 Rhyno V5 Nano",
    "gpt-4o-realtime-preview-2025-06-03": "🎙️ Rhyno Live V1",
    "gpt-4o-mini-realtime-preview-2024-12-17": "🎧 Rhyno Live Mini",
    "dall-e-3": "🎨 Rhyno Image V1",
    "google/gemini-2.5-flash-image": "🎨 Rhyno Image V2",
    "gpt-5-codex": "💻 Rhyno Code V1",
    "google/gemini-2.5-pro": "🖥️ Rhyno Pro"
}

type Wallet = Tables<'wallets'>;
type Transaction = Tables<'transactions'>;
interface ModelUsage {
    model_name: string;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_cost_usd: number;
}


const LoadingIndicator = () => (
    <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
    </View>
);
const UsageHistory: React.FC<{ userId: string }> = ({ userId }) => {
    const [usage, setUsage] = useState<ModelUsage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            setLoading(true);
            try {
                // ✅ استفاده از supabase ایمپورت شده
                const { data, error } = await supabase.rpc(
                    "get_user_model_usage", // ‼️ نام RPC function را چک کنید
                    { p_user_id: userId }
                );
                if (error) throw error;
                setUsage((data as ModelUsage[]) || []);
            } catch (error: any) {
                console.error("Error fetching usage:", error);
                Alert.alert("خطا", "خطا در دریافت تاریخچه مصرف");
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, [userId]);

    if (loading) return <ActivityIndicator color="#aaa" style={{ marginVertical: 20 }} />;

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScrollContainer}
            contentContainerStyle={{ paddingRight: 5 }}
        >
            {usage.length > 0 ? (
                usage.map(item => (
                    <View key={item.model_name} style={styles.usageCardItem}>
                        <Text style={styles.modelName}>
                            {MODEL_DISPLAY_NAMES[item.model_name] || item.model_name}
                        </Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>توکن‌های ورودی:</Text>
                            <Text style={styles.detailValue}>{formatToken(item.total_prompt_tokens)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>توکن‌های خروجی:</Text>
                            <Text style={styles.detailValue}>{formatToken(item.total_completion_tokens)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>مجموع توکن‌ها:</Text>
                            <Text style={styles.totalValue}>{formatToken(item.total_prompt_tokens + item.total_completion_tokens)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.costRow]}>
                            <Text style={styles.costLabel}>هزینه کل:</Text>
                            <Text style={styles.costValue}>{formatCostToToman(item.total_cost_usd)} تومان</Text>
                        </View>
                    </View>
                ))
            ) : (
                // ✅ بهبود حالت خالی
                <View style={[styles.usageCardItem, styles.emptyHistoryItem]}>
                    <Text style={styles.emptyText}>تاریخچه مصرفی وجود ندارد.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const DepositHistory: React.FC<{ userId: string }> = ({ userId }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                // ✅ استفاده از supabase ایمپورت شده
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("user_id", userId)
                    .eq("status", "completed")
                    .order("created_at", { ascending: false })
                    .limit(5);
                if (error) throw error;
                setTransactions((data as Transaction[]) || []);
            } catch (error: any) {
                console.error("Error fetching transactions:", error);
                Alert.alert("خطا", "خطا در دریافت تاریخچه واریز");
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [userId]);

    if (loading) return <ActivityIndicator color="#aaa" style={{ marginVertical: 20 }} />;

    return (
        // ❗️ حذف کانتینر اضافی - استایل‌ها مستقیم روی View اصلی اعمال می‌شوند
        <View>
            {transactions.length > 0 ? (
                transactions.map(tx => (
                    // ❗️❗️ باگ اصلی: استایل historyItem حذف شد
                    <View key={tx.id} style={styles.depositItemCard}>
                        <View>
                            <Text style={styles.depositStatus}>
                                <Icon name="checkmark-circle" size={16} color="#4CAF50" /> شارژ موفق
                            </Text>
                            <Text style={styles.depositDate}>
                                {new Date(tx.created_at).toLocaleString("fa-IR")}
                            </Text>
                        </View>
                        <Text style={styles.depositAmount}>
                            + {(tx.amount_irr / 10).toLocaleString("fa-IR")} تومان
                        </Text>
                    </View>
                ))
            ) : (
                // ✅ بهبود حالت خالی
                <View style={[styles.depositItemCard, styles.emptyHistoryItem]}>
                    <Text style={styles.emptyText}>تاریخچه واریزی وجود ندارد.</Text>
                </View>
            )}
        </View>
    );
};

export default function SettingsScreen() {
    const { user, isLoadingAuth, session } = useChat(); // گرفتن کاربر از Context
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(true);
    const navigation = useNavigation<any>();
    const handleNavigateToPayment = () => {
        // 'CustomPayment' اسمی است که در مرحله بعد به صفحه پرداخت می‌دهیم
        navigation.navigate('CustomPayment');
    };
    // افکت برای گرفتن موجودی کیف پول
    useEffect(() => {
        const fetchWallet = async () => {
            if (!user) return; // اگر کاربر هنوز لود نشده

            setIsLoadingWallet(true);
            try {
                // ✅ استفاده از supabase ایمپورت شده
                const { data, error } = await supabase
                    .from("wallets")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                if (error && error.code !== "PGRST116") throw error;
                setWallet(data as Wallet || null);
            } catch (error: any) {
                console.error("Error fetching wallet:", error);
            } finally {
                setIsLoadingWallet(false);
            }
        };

        if (!isLoadingAuth) {
            fetchWallet();
        }
    }, [user, isLoadingAuth]);

    if (isLoadingAuth || isLoadingWallet) {
        return <LoadingIndicator />;
    }

    if (!user) {


        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>کاربر یافت نشد. لطفاً دوباره وارد شوید.</Text>
                {/* دکمه خروج؟ */}
            </View>
        );
    }

    return (
        // ✅ اضافه شدن SafeAreaView برای حل مشکل همپوشانی با نوار وضعیت
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContainer} // ✅ پدینگ به اینجا منتقل شد
                showsVerticalScrollIndicator={false} // اسکرول بار مخفی شد
            >
                {/* ✅ اضافه شدن سرتیتر */}
                <Text style={styles.sectionTitle}>حساب کاربری</Text>

                {/* ۱. کارت موجودی (با گرادینت) */}
                <LinearGradient
                    colors={['#0A84FF', '#0052A8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, styles.balanceCard]}
                >
                    {/* ✅ بهبود چینش عنوان */}
                    <View style={styles.cardTitleContainer}>
                        {/* آیکون کیف پول اضافه شد */}
                        <Icon name="wallet-outline" size={20} style={styles.cardTitleIcon} />
                        <Text style={styles.cardTitle}>موجودی حساب</Text>
                    </View>

                    <Text style={styles.balanceAmount}>
                        {wallet ? formatBalance(wallet.balance) : "۰"}
                        <Text style={styles.balanceUnit}> تومان</Text>
                    </Text>
                </LinearGradient>
                <TouchableOpacity
                    style={styles.chargeButton}
                    onPress={handleNavigateToPayment}
                >
                    <Icon name="add-circle-outline" size={22} color="#fff" />
                    <Text style={styles.chargeButtonText}>شارژ حساب</Text>
                </TouchableOpacity>
                {/* ۲. کارت اطلاعات کاربر */}
                <View style={styles.card}>
                    {/* ✅ بهبود چینش عنوان */}
                    <View style={styles.cardTitleContainer}>
                        <Icon name="person-outline" size={18} style={styles.cardTitleIcon} />
                        <Text style={styles.cardTitle}>اطلاعات شما</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="mail-outline" size={16} style={styles.infoIcon} />
                        <Text style={styles.infoText}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="call-outline" size={16} style={styles.infoIcon} />
                        <Text style={styles.infoText}>{user.phone || "شماره ثبت نشده"}</Text>
                    </View>
                </View>

                {/* ✅ اضافه شدن سرتیتر */}
                <Text style={styles.sectionTitle}>تاریخچه</Text>

                {/* ۳. کارت تاریخچه مصرف */}
                <View style={styles.card}>
                    {/* ✅ بهبود چینش عنوان */}
                    <View style={styles.cardTitleContainer}>
                        <MaterialCommunityIcons name="chart-pie" size={18} style={styles.cardTitleIcon} />
                        <Text style={styles.cardTitle}>آمار مصرف مدل‌ها</Text>
                    </View>
                    <UsageHistory userId={user.id} />
                </View>

                {/* ۴. کارت تاریخچه واریز */}
                <View style={styles.card}>
                    {/* ✅ بهبود چینش عنوان */}
                    <View style={styles.cardTitleContainer}>
                        <Icon name="receipt-outline" size={18} style={styles.cardTitleIcon} />
                        <Text style={styles.cardTitle}>تاریخچه ۵ واریز اخیر</Text>
                    </View>
                    <DepositHistory userId={user.id} />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}


const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';
const styles = StyleSheet.create({
    // --- چیدمان اصلی ---
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        fontFamily: FONT_REGULAR,
    },
    screen: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30, // فاصله در انتهای اسکرول
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: FONT_REGULAR,
    },
    // --- سرتیتر بخش‌ها ---
    sectionTitle: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 10,
        fontFamily: FONT_REGULAR,
    },
    // --- کارت‌های اصلی ---
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12, // کمی گردتر
        padding: 15,
        marginBottom: 15,
        fontFamily: FONT_REGULAR,
    },

    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        fontFamily: FONT_REGULAR,
    },
    cardTitleIcon: {
        color: '#fff',
        marginRight: 8,
        fontFamily: FONT_REGULAR,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },

    balanceCard: {
        alignItems: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 10,
        fontFamily: FONT_REGULAR,
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },
    balanceUnit: {
        fontSize: 20,
        fontWeight: 'normal',
        fontFamily: FONT_REGULAR,
    },
    // ۲. اطلاعات کاربر
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        fontFamily: FONT_REGULAR,
    },
    infoIcon: {
        color: '#8E8E93',
        marginRight: 10,
        fontFamily: FONT_REGULAR,
    },
    infoText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: FONT_REGULAR,
    },

    horizontalScrollContainer: {
        marginHorizontal: -5,
    },
    usageCardItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 10,
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        width: 300,
        marginHorizontal: 5,
        fontFamily: FONT_REGULAR,
    },
    modelName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: FONT_REGULAR,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    detailLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontFamily: FONT_REGULAR,
    },
    detailValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
        fontFamily: FONT_REGULAR,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#3A3A3C',
        paddingTop: 8,
        marginTop: 8,
        fontFamily: FONT_REGULAR,
    },
    totalLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },
    totalValue: {
        color: '#5AC8FA',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },
    costRow: {

    },
    costLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },
    costValue: {
        color: '#FFCC00',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },

    depositItemCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: FONT_REGULAR,
    },
    depositStatus: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flexDirection: 'row',
        alignItems: 'center',
        fontFamily: FONT_REGULAR,
    },
    depositDate: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 3,
        fontFamily: FONT_REGULAR,
    },
    depositAmount: {
        color: '#4CAF50',
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
    },

    emptyHistoryItem: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
        padding: 20,
        fontFamily: FONT_REGULAR,
    },
    emptyText: {
        color: '#8E8E93',
        textAlign: 'center',
        fontSize: 13,
        fontFamily: FONT_REGULAR,
    },
    chargeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#012146ff', // استفاده از رنگ آبی اصلی
        paddingVertical: 20,
        borderRadius: 12,
        marginHorizontal: 10, // کمی کوچکتر از کارت اصلی
        marginTop: 5, // برای اینکه کمی زیر کارت بالایی برود
        zIndex: -1, // اطمینان از اینکه زیر سایه کارت بالایی است
        paddingTop: 18, // چون 10 پیکسل بالا رفته، پدینگ را بیشتر می‌کنیم
        marginBottom: 15, // فاصله از کارت پایینی
    },
    chargeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontFamily: FONT_BOLD,
        marginLeft: 8,
    },
});