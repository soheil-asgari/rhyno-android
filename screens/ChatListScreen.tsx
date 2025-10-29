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
    Alert, // ✅ برای نمایش خطا
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // ✅ useFocusEffect اضافه شد
import type { DrawerNavigationType } from './Navigation';
import { supabase } from '../lib/supabase'; // ✅ ایمپورت supabase
import { Session, User } from '@supabase/supabase-js'; // ✅ ایمپورت تایپ‌ها
import { useChat } from '../context/ChatContext';


// ✅ تعریف تایپ برای یک آیتم چت از دیتابیس (بر اساس جدول chats شما)
interface Chat {
    id: string;
    name: string;
    // ... سایر فیلدها؟
}

export default function ChatListScreen() {
    const navigation = useNavigation<DrawerNavigationType>();
    // 👇 ۲. گرفتن تابع setCurrentChatId و user از Context
    const { setCurrentChatId, user } = useChat();

    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            if (!user) { // فقط اگر کاربر وجود دارد
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('chats')
                    .select('id, name') // فقط فیلدهای لازم
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }); // جدیدترین‌ها اول

                if (error) throw error;
                setChats(data || []);
            } catch (error: any) {
                console.error("Error fetching chats:", error);
                Alert.alert("خطا", "خطا در دریافت لیست چت‌ها");
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [user]);


    const handleChatPress = (chatId: string, chatName: string) => {
        console.log(`Opening chat: ${chatName} (ID: ${chatId})`);

        // 1. Update global Context
        setCurrentChatId(chatId);

        // 2. Navigate, explicitly providing the params object
        navigation.navigate('Chat', { chatId: undefined }); // 👈 Corrected here
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
        <View style={styles.container}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.chatItem}
                        onPress={() => handleChatPress(item.id, item.name)} // 👈 اتصال onPress
                    >
                        <Text style={styles.chatName}>{item.name || "چت بدون نام"}</Text>
                        {/* می‌توانید تاریخ یا آخرین پیام را هم نشان دهید */}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>تاریخچه چتی وجود ندارد.</Text>}
            />
        </View>
    );
}




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
        backgroundColor: '#1C1C1E',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#3A3A3C',
    },
    chatName: {
        color: '#fff',
        fontSize: 16,
    },
    emptyText: {
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 14,
    },
});