// screens/ChatListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // ✅ useEffect و useCallback اضافه شد
import {
    View,
    Text,
    Button,
    StyleSheet,
    FlatList,
    ActivityIndicator, // ✅ برای نمایش لودینگ
    TouchableOpacity, // ✅ برای کلیک روی آیتم‌ها
    Alert,
    BackHandler // ✅ برای نمایش خطا
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // ✅ useFocusEffect اضافه شد
import type { DrawerNavigationType } from '../types/navigation.types';
import { supabase } from '../lib/supabase'; // ✅ ایمپورت supabase
import { Session, User } from '@supabase/supabase-js'; // ✅ ایمپورت تایپ‌ها
import { useChat } from '../context/ChatContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonActions } from '@react-navigation/native';
import { useAndroidBackHandler } from './Navigation';

// ✅ تعریف تایپ برای یک آیتم چت از دیتابیس (بر اساس جدول chats شما)
interface Chat {
    id: string;
    name: string;
    updated_at: string;
}

const LastMessage = React.memo(({ chatId }: { chatId: string }) => {
    const [lastMsg, setLastMsg] = useState("...");
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchLastMessage = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('content')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: false }) // جدیدترین پیام
                .limit(1) // فقط یکی
                .single(); // دریافت یک آبجکت به جای آرایه

            if (data && data.content) {
                // اگر پیام حاوی عکس است، متن "تصویر" را نشان بده
                if (data.content.startsWith('data:image') || data.content.includes('%RHINO_IMAGE_SEPARATOR%')) {
                    setLastMsg("[تصویر]");
                } else {
                    setLastMsg(data.content);
                }
            } else if (error) {
                // ✅ این بلوک اصلاح شد
                // چک می‌کنیم که آیا خطا همان خطای "پیدا نشدن ردیف" است یا خیر
                if (error.code === 'PGRST116') {
                    // این یک خطای واقعی نیست، یعنی چت خالی است
                    setLastMsg("هنوز پیامی ارسال نشده");
                } else {
                    // این یک خطای واقعی است (مثل خطای شبکه یا RLS)
                    console.warn(`Error fetching last msg for chat ${chatId}:`, error.message);
                    setLastMsg(""); // در صورت خطای واقعی، چیزی نشان نده
                }
            } else {
                // (این حالت به ندرت اتفاق می‌افتد، اما برای اطمینان)
                setLastMsg("هنوز پیامی ارسال نشده");
            }

            setLoading(false);
            // --- 👆 پایان منطق اصلاح شده ---
        };

        fetchLastMessage();
    }, [chatId]);
    return (
        <Text style={styles.lastMessage} numberOfLines={1}>
            {loading ? "..." : lastMsg}
        </Text>
    );
});


function formatTimestamp(timestamp: string | undefined | null): string {
    if (!timestamp) return "";

    const now = new Date();
    const date = new Date(timestamp);

    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffDays = Math.floor(diffSeconds / 86400);

    if (diffDays === 0) {
        // امروز: نمایش ساعت
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
        return "دیروز";
    }
    if (diffDays < 7) {
        // این هفته: نمایش روز هفته
        return date.toLocaleDateString('fa-IR', { weekday: 'long' });
    }
    // قدیمی‌تر: نمایش تاریخ کامل
    return date.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}


export default function ChatListScreen() {


    const navigation = useNavigation<DrawerNavigationType>();
    useAndroidBackHandler(navigation);
    // 👇 ۲. گرفتن تابع setCurrentChatId و user از Context
    const { setCurrentChatId, user, currentChatId } = useChat();

    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    // screens/ChatListScreen.tsx

    useFocusEffect(
        useCallback(() => {
            // ✅ ۱. پرچم برای جلوگیری از آپدیت state بعد از unmount شدن
            let isActive = true;

            const fetchChats = async () => {
                if (!user) {
                    if (isActive) setLoading(false);
                    return;
                }

                // ✅ ۲. ست کردن لودینگ (این درست است)
                setLoading(true);

                try {
                    const { data, error } = await supabase
                        .from('chats')
                        .select('id, name, updated_at')
                        .eq('user_id', user.id)
                        .order('updated_at', { ascending: false, nullsFirst: false });

                    if (error) throw error;

                    // ✅ ۳. فقط اگر کامپوننت هنوز فعال است، state را آپدیت کن
                    if (isActive) {
                        setChats(data || []);
                    }
                } catch (error: any) {
                    // ✅ ۴. مدیریت خطا فقط در صورت فعال بودن
                    if (isActive) {
                        console.error("Error fetching chats:", error);
                        Alert.alert("خطا", "خطا در دریافت لیست چت‌ها");
                    }
                } finally {
                    // ✅ ۵. توقف لودینگ فقط در صورت فعال بودن
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };

            fetchChats();

            // ✅✅✅ ۶. تابع پاکسازی (Cleanup) ✅✅✅
            // این تابع زمانی اجرا می‌شود که صفحه از فوکوس خارج شود
            return () => {
                console.log("ChatList is un-focusing, cleaning up...");
                isActive = false;
            };

        }, [user, supabase]) // وابستگی‌ها درست هستند
    );
    // useEffect(() => {
    //     const fetchChats = async () => {
    //         if (!user) { // فقط اگر کاربر وجود دارد
    //             setLoading(false);
    //             return;
    //         }
    //         setLoading(true);
    //         try {
    //             const { data, error } = await supabase
    //                 .from('chats')
    //                 .select('id, name, updated_at')// فقط فیلدهای لازم
    //                 .eq('user_id', user.id)
    //                 .order('created_at', { ascending: false }); // جدیدترین‌ها اول
    //             console.log(data);

    //             if (error) throw error;
    //             setChats(data || []);
    //         } catch (error: any) {
    //             console.error("Error fetching chats:", error);
    //             Alert.alert("خطا", "خطا در دریافت لیست چت‌ها");
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchChats();
    // }, [user]);

    const handleNewChat = useCallback(() => {
        console.log("Creating new chat...");
        setCurrentChatId(undefined);
        navigation.navigate('Chat', { chatId: undefined });
        navigation.closeDrawer();
    }, [navigation, setCurrentChatId]); // <-- وابستگی‌ها اضافه شد

    const handleChatPress = (chatId: string) => {
        // ✅ ۱. اول به Context بگویید کدام چت فعال است
        setCurrentChatId(chatId);

        // ✅ ۲. سپس به صفحه چت بروید
        navigation.navigate('Chat', { chatId: chatId });
    };

    if (loading) {
        return (
            // 👇 استفاده از SafeAreaView برای لودینگ
            <SafeAreaView style={styles.centeredSafeArea}>
                <ActivityIndicator size="large" color="#fff" />
            </SafeAreaView>
        );
    }
    return (
        // 👇 یک View والد برای نگهداری لیست و دکمه اضافه شد
        <View style={styles.container}>
            <SafeAreaView style={styles.containerSafeArea}>
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 5 }} // ✅ اضافه کردن کمی فاصله در بالا و پایین لیست
                    renderItem={({ item }) => {
                        // ✅ ۱. چک می‌کنیم آیا این آیتم، چت فعال فعلی است؟
                        const isActive = item.id === currentChatId;

                        return (
                            <TouchableOpacity
                                // ✅ ۲. استایل را بر اساس فعال بودن، شرطی می‌کنیم
                                style={[
                                    styles.chatItem,
                                    isActive && styles.chatItemActive
                                ]}
                                onPress={() => handleChatPress(item.id)}
                            >
                                <View style={styles.chatItemContent}>
                                    <View style={styles.chatTextContainer}>
                                        <Text
                                            // ✅ ۳. رنگ متن نام چت هم بر اساس فعال بودن تغییر می‌کند
                                            style={[
                                                styles.chatName,
                                                isActive && styles.chatNameActive
                                            ]}
                                        >
                                            {item.name || "چت بدون نام"}
                                        </Text>
                                        <Text
                                            // ✅ ۴. رنگ متن آخرین پیام هم تغییر می‌کند
                                            style={[
                                                styles.lastMessage,
                                                isActive && styles.lastMessageActive
                                            ]}
                                            numberOfLines={1}
                                        >
                                            <LastMessage chatId={item.id} />
                                        </Text>
                                    </View>
                                    <Text
                                        // ✅ ۵. رنگ زمان هم تغییر می‌کند
                                        style={[
                                            styles.timestamp,
                                            isActive && styles.timestampActive
                                        ]}
                                    >
                                        {formatTimestamp(item.updated_at)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={<Text style={styles.emptyText}>تاریخچه چتی وجود ندارد.</Text>}
                />
            </SafeAreaView>

            {/* 👇 دکمه شناور (FAB) برای چت جدید */}
            <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
                <Icon name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}


const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';

// استایل‌های ChatListScreen
const styles = StyleSheet.create({
    containerSafeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    centeredSafeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',

    },
    chatItem: {
        backgroundColor: '#1C1C1E', // خاکستری تیره
        padding: 15,
        borderRadius: 12, // ✅ گرد کردن گوشه‌ها
        marginHorizontal: 10, // ✅ فاصله افقی
        marginVertical: 5, // ✅ فاصله عمودی
        fontFamily: FONT_REGULAR,
    },
    emptyText: {
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 14,
        fontFamily: FONT_REGULAR,
    },
    chatItemActive: { // ✅ استایل جدید برای آیتم فعال
        backgroundColor: '#0A84FF', // رنگ آبی
    },
    // 👇 این استایل‌ها اضافه شوند
    chatItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: FONT_REGULAR,
    },
    chatTextContainer: {
        flex: 1, // اجازه می‌دهد متن، فضا را پر کند
        marginRight: 10,
    },
    chatName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold', // نام چت را برجسته کنید
        marginBottom: 3, // فاصله کم
        fontFamily: FONT_REGULAR,
    },
    lastMessage: {
        color: '#8E8E93', // رنگ خاکستری
        fontSize: 14,
        fontFamily: FONT_REGULAR,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#0A84FF', // رنگ آبی
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8, // سایه در اندروید
        shadowColor: '#000', // سایه در iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        fontFamily: FONT_REGULAR,
    },
    lastMessageActive: { // ✅ استایل متن فعال
        color: '#E0E0E0',
        fontFamily: FONT_REGULAR, // کمی روشن‌تر از سفید
    },
    timestamp: {
        color: '#8E8E93',
        fontSize: 12,
    },
    timestampActive: { // ✅ استایل متن فعال
        color: '#E0E0E0',
    },
    chatNameActive: { // ✅ استایل متن فعال
        color: '#FFFFFF',
        fontFamily: FONT_REGULAR,
    },
});