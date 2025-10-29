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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../context/ChatContext';
import { supabase } from '../lib/supabase';
import { Tables } from '../supabase/types';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


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
        <View style={styles.historyContainer}>
            {usage.length > 0 ? (
                usage.map(item => (
                    <View key={item.model_name} style={styles.historyItem}>
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
                <Text style={styles.emptyText}>تاریخچه مصرفی وجود ندارد.</Text>
            )}
        </View>
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
        <View style={styles.historyContainer}>
            {transactions.length > 0 ? (
                transactions.map(tx => (
                    <View key={tx.id} style={[styles.historyItem, styles.depositItem]}>
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
                <Text style={styles.emptyText}>تاریخچه واریزی وجود ندارد.</Text>
            )}
        </View>
    );
};

export default function SettingsScreen() {
    const { user, isLoadingAuth, session } = useChat(); // گرفتن کاربر از Context
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(true);

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

                if (error && error.code !== "PGRST116") throw error; // خطای 116 یعنی کیف پول وجود نداره
                setWallet(data as Wallet || null);
            } catch (error: any) {
                console.error("Error fetching wallet:", error);
            } finally {
                setIsLoadingWallet(false);
            }
        };

        if (!isLoadingAuth) { // فقط بعد از اتمام لود کاربر اجرا شود
            fetchWallet();
        }
    }, [user, isLoadingAuth]); // به تغییر کاربر حساس باشد

    if (isLoadingAuth || isLoadingWallet) {
        return <LoadingIndicator />;
    }

    if (!user) {
        // این حالت نباید پیش بیاید چون Drawer فقط برای کاربر لاگین شده است
        // اما برای اطمینان اینجا قرار می‌دهیم
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>کاربر یافت نشد. لطفاً دوباره وارد شوید.</Text>
                {/* دکمه خروج؟ */}
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen}>
            {/* ۱. کارت موجودی */}
            <View style={[styles.card, styles.balanceCard]}>
                <Text style={styles.cardTitle}>موجودی حساب</Text>
                <Text style={styles.balanceAmount}>
                    {wallet ? formatBalance(wallet.balance) : "۰"}
                    <Text style={styles.balanceUnit}> تومان</Text>
                </Text>
            </View>

            {/* ۲. کارت اطلاعات کاربر */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}><Icon name="person-outline" size={18} /> اطلاعات شما</Text>
                <View style={styles.infoRow}>
                    <Icon name="mail-outline" size={16} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="call-outline" size={16} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{user.phone || "شماره ثبت نشده"}</Text>
                </View>
            </View>

            {/* ۳. کارت تاریخچه مصرف */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    <MaterialCommunityIcons name="chart-pie" size={18} /> آمار مصرف مدل‌ها
                </Text>
                <UsageHistory userId={user.id} />
            </View>

            {/* ۴. کارت تاریخچه واریز */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    <Icon name="receipt-outline" size={18} /> تاریخچه ۵ واریز اخیر
                </Text>
                <DepositHistory userId={user.id} />
            </View>

            {/* TODO: بخش شارژ حساب و تیکت‌ها در آینده اضافه شود */}

        </ScrollView>
    );
}

// --- استایل‌ها ---
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000',
        padding: 15,
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
    },
    card: {
        backgroundColor: '#1C1C1E', // خاکستری تیره برای کارت‌ها
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        flexDirection: 'row', // برای آیکون کنار تایتل
        alignItems: 'center',
    },
    // کارت موجودی
    balanceCard: {
        backgroundColor: '#0A84FF', // آبی
        alignItems: 'center',
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    balanceUnit: {
        fontSize: 20,
        fontWeight: 'normal',
    },
    // اطلاعات کاربر
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoIcon: {
        color: '#8E8E93', // خاکستری روشن
        marginRight: 10,
    },
    infoText: {
        color: '#fff',
        fontSize: 14,
    },
    // تاریخچه‌ها
    historyContainer: {
        marginTop: 5,
    },
    historyItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C', // جداکننده تیره‌تر
        paddingVertical: 12,
        marginBottom: 10,
    },
    modelName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    detailLabel: {
        color: '#8E8E93',
        fontSize: 13,
    },
    detailValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#3A3A3C',
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    totalValue: {
        color: '#5AC8FA', // آبی روشن
        fontSize: 14,
        fontWeight: 'bold',
    },
    costRow: {
        // borderTopWidth: 1,
        // borderTopColor: '#3A3A3C',
        // paddingTop: 8,
        // marginTop: 8,
    },
    costLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    costValue: {
        color: '#FFCC00', // زرد
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 13,
    },
    // تاریخچه واریز
    depositItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    depositStatus: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flexDirection: 'row',
        alignItems: 'center',
    },
    depositDate: {
        color: '#8E8E93',
        fontSize: 11,
        marginTop: 3,
    },
    depositAmount: {
        color: '#4CAF50', // سبز
        fontSize: 15,
        fontWeight: 'bold',
    },
});