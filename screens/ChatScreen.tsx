// ✅ ChatScreen.tsx (TS + Real Stream Optimized)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GiftedChat, Composer, IMessage, Bubble, } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Button,
    Text,
    ScrollView,
    View,
    ActivityIndicator,
    Platform,
    FlatList,
    Alert,
    ListRenderItem
} from 'react-native';
import 'text-encoding-polyfill';
import type { DrawerParamList, DrawerNavigationType } from './Navigation';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import { useChat } from '../context/ChatContext'; // ✅ ۱. خواندن از Context
import { supabase } from '../lib/supabase'; // 👈 ۲. ایمپورت کردن Supabase

const YOUR_BACKEND_URL = 'https://www.rhynoai.ir';
type ChatSettings = any;

// ... (createBotMessage and getTimestamp functions remain the same) ...
const createBotMessage = (id: string | number, text: string): IMessage => ({
    _id: id,
    text,
    createdAt: new Date(),
    user: { _id: 2, name: 'Rhyno AI' },
});

const getTimestamp = (dateOrNumber: Date | number | undefined): number => {
    if (dateOrNumber instanceof Date) return dateOrNumber.getTime();
    if (typeof dateOrNumber === 'number') return dateOrNumber;
    return 0;
};
type ChatScreenRouteProp = RouteProp<DrawerParamList, 'Chat'>;

// ❌ لیست ثابت MODELS حذف شد چون از Context می‌آید

export default function ChatScreen() {


    const route = useRoute<ChatScreenRouteProp>();
    const navigation = useNavigation<DrawerNavigationType>();

    // 👇 گرفتن State های اصلی از Context
    const {
        session,
        user,
        isLoadingAuth,
        currentChatId,       // 👈 State سراسری
        setCurrentChatId,    // 👈 State سراسری
        selectedModel,       // 👈 State سراسری
    } = useChat();
    const displayName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.username || // <-- Added username check
        user?.email ||
        "کاربر";

    // Extract the first part (robustly handles spaces, @, etc.)
    const firstName = displayName.split(/[\s@,.;]+/)[0];
    // 👇 State های محلی فقط برای خود صفحه چت
    const [messages, setMessages] = useState<IMessage[]>([]);
    const flatListRef = useRef<FlatList<IMessage>>(null);
    const [isSending, setIsSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [currentChatName, setCurrentChatName] = useState<string | null>(null);

    // ❌ State های تکراری حذف شدند (isLoadingUser, currentModel)
    const handleLogout = () => {
        Alert.alert(
            'خروج', // Title
            'آیا مطمئن هستید؟', // Message
            [
                {
                    text: 'انصراف', // Cancel button
                    style: 'cancel',
                },
                {
                    text: 'خروج', // Logout button
                    // 👇 Call supabase.auth.signOut here
                    onPress: async () => {
                        console.log('Attempting to log out...');
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            console.error('Error logging out:', error);
                            Alert.alert("خطا", "خطا در هنگام خروج: " + error.message);
                        } else {
                            console.log('Successfully logged out.');
                            // No need for navigation here. 
                            // The ChatContext listener will detect the user change 
                            // and the main App navigation should handle the redirect.
                        }
                    },
                    style: 'destructive', // Makes the text red on iOS
                },
            ]
        );
    };
    const handleGPTsPress = () => {
        Alert.alert('GPTs', 'آیکون GPTs فشار داده شد');
    };
    const handleMenuPress = () => {
        navigation.openDrawer();
    };

    const handleNewChatPress = () => {
        // Alert.alert('چت جدید', 'آیکون چت جدید فشار داده شد');
        setCurrentChatId(undefined); // 👈 آپدیت Context
        navigation.navigate('Chat', { chatId: undefined }); // 👈 هدایت به صفحه
    };

    const handleOptionsPress = () => {
        Alert.alert('تنظیمات', 'آیکون سه نقطه فشار داده شد');
    };

    // افکت برای اسکرول خودکار (بدون تغییر)
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSendMessage = (text: string) => {
        if (!user || isSending) { // ✅ استفاده از user (از Context)
            Alert.alert('خطا', 'لطفا صبر کنید یا وارد شوید.');
            return;
        }

        const newMessage: IMessage = {
            _id: `user-${Date.now()}`,
            text: text,
            createdAt: new Date(),
            user: { _id: 1, name: user.email || 'You' } // ✅ استفاده از user (از Context)
        };

        const typingMessageId = `typing-${Date.now()}`;
        const typingMessage = createBotMessage(typingMessageId, '...');
        typingMessageIdRef.current = typingMessageId;

        setIsSending(true);
        setMessages(previousMessages =>
            [...previousMessages, newMessage, typingMessage]
        );

        const historyForAPI = [...messages, newMessage];
        const backendMessages = historyForAPI
            .filter(msg => !(msg.user._id === 2 && msg.text === '...'))
            .sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
            .map(msg => ({
                role: msg.user._id === 1 ? 'user' : 'assistant',
                content: msg.text,
            }));

        callChatAPI(backendMessages);
    };

    const handleAttachPress = () => {
        Alert.alert('پیوست', 'آیکون + فشار داده شد');
    };

    const handleVoiceInputPress = () => {
        Alert.alert('ورودی صوتی', 'آیکون میکروفون فشار داده شد');
    };

    // ❌ handleModelChange حذف شد

    // --- Refs for smooth streaming ---
    const accumulatedTextRef = useRef('');
    const typingMessageIdRef = useRef<string | number | null>(null);
    const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    // ------------------------------------------

    // ... (startStreamingUpdates و stopStreamingUpdates بدون تغییر) ...
    const startStreamingUpdates = () => {
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = setInterval(() => {
            if (!typingMessageIdRef.current) return;
            const currentText = accumulatedTextRef.current;
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === typingMessageIdRef.current
                        ? { ...msg, text: currentText.length ? currentText : '...' }
                        : msg,
                ),
            );
        }, 200);
    };

    const stopStreamingUpdates = (isError: boolean = false) => {
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
        if (!isError && typingMessageIdRef.current) {
            const finalText = accumulatedTextRef.current;
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === typingMessageIdRef.current
                        ? { ...msg, text: finalText || 'پاسخی دریافت نشد.' }
                        : msg,
                ),
            );
        }
        accumulatedTextRef.current = '';
        typingMessageIdRef.current = null;
        setIsSending(false);
    };

    // ✅ استفاده از supabase (ایمپورت شده)
    const fetchMessages = useCallback(async (chatId: string) => {
        if (!chatId) {
            setMessages([]);
            setLoadingMessages(false);
            setInitialLoadComplete(true);
            return;
        }
        console.log('Fetching messages for chat ID:', chatId);
        setLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('id, content, role, created_at, model')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true }); // ✅ (صحیح است)

            if (error) throw error;
            const formattedMessages: IMessage[] = (data || []).map((msg: any) => ({
                _id: msg.id,
                text: msg.content || '',
                createdAt: new Date(msg.created_at),
                user: {
                    _id: msg.role === 'user' ? 1 : 2,
                    name: msg.role === 'user' ? 'You' : msg.model || 'Rhyno AI',
                },
            }));
            setMessages(formattedMessages);
            setInitialLoadComplete(true);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            Alert.alert('خطا', 'خطا در دریافت پیام‌های قبلی: ' + error.message);
            setInitialLoadComplete(true);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // ✅ استفاده از supabase (ایمپورت شده)
    const updateChatName = async (chatId: string, firstUserMessage: string) => {
        const newName = firstUserMessage.split(' ').slice(0, 5).join(' ') || "چت";
        console.log(`>>> Attempting to update chat ID: ${chatId} to ${newName}`);
        try {
            const { data, error } = await supabase
                .from('chats')
                .update({ name: newName })
                .eq('id', chatId)
                .select();
            if (error) throw error;
            setCurrentChatName(newName);
        } catch (error: any) {
            console.error('>>> Error in updateChatName:', error);
        }
    };

    // ✅ useEffect اصلی برای لود کردن چت
    useEffect(() => {
        const chatId = currentChatId; // خواندن از Context
        setInitialLoadComplete(false); // ریست کردن

        const loadChat = async () => {
            if (user && chatId) { // ✅ چک کردن user (از Context)
                setLoadingMessages(true);
                try {
                    const { data: chatData, error: chatError } = await supabase
                        .from('chats')
                        .select('name')
                        .eq('id', chatId)
                        .single();
                    if (chatError) throw chatError;
                    setCurrentChatName(chatData?.name || null);
                    await fetchMessages(chatId);
                } catch (error: any) {
                    console.error('Error fetching chat details:', error);
                    Alert.alert('خطا', 'خطا در دریافت اطلاعات چت.');
                } finally {
                    setLoadingMessages(false);
                    setInitialLoadComplete(true);
                }
            } else if (!chatId) {
                // حالت "چت جدید"
                setMessages([]);
                setCurrentChatName("چت جدید");
                setLoadingMessages(false);
                setInitialLoadComplete(true);
            }
        };

        if (!isLoadingAuth) { // فقط بعد از اتمام بررسی احراز هویت اجرا شود
            loadChat();
        }
    }, [currentChatId, user, isLoadingAuth, fetchMessages]); // ✅ وابستگی‌ها تصحیح شد

    // ❌ useEffect تکراری حذف شد

    // ❌ onSend (که بر اساس GiftedChat بود) حذف شد چون از آن استفاده نمی‌کنیم

    // ✅ callChatAPI تصحیح شد
    const callChatAPI = async (messageHistory: any[]) => {
        const currentSessionFromContext = session; // ✅ خواندن از Context

        // ✅ چک کردن session, user (از Context)
        if (!currentSessionFromContext?.access_token || !currentChatId || !user) {
            console.error('No valid session/token, chat ID, or user for streaming.');
            stopStreamingUpdates(true);
            Alert.alert("خطا", "ارتباط با سرور برقرار نشد. لطفاً دوباره وارد شوید.");
            return;
        }

        const accessToken = currentSessionFromContext.access_token;
        accumulatedTextRef.current = '';
        const url = `${YOUR_BACKEND_URL}/api/chat/openai`;
        const chatSettings = {
            model: selectedModel, // ✅ استفاده از selectedModel (از Context)
        };
        const userId = user.id; // ✅ استفاده از user (از Context)
        const chatId = currentChatId;

        const body = JSON.stringify({
            chatSettings: chatSettings,
            messages: messageHistory,
            enableWebSearch: true,
        });

        startStreamingUpdates();

        try {
            const xhr = new XMLHttpRequest();
            let seenBytes = 0;
            const userMessageContent = messageHistory[messageHistory.length - 1]?.content;
            if (userMessageContent) {
                console.log('Saving user message to DB...');
                // ✅ استفاده از supabase (ایمپورت شده)
                const { error: saveUserMsgError } = await supabase.from('messages').insert({
                    chat_id: chatId,
                    user_id: userId,
                    role: 'user',
                    content: userMessageContent,
                    image_paths: [],
                    model: "",
                    sequence_number: 0,
                });
                if (saveUserMsgError) console.error('Error saving user message:', saveUserMsgError);
                else console.log('User message saved.');
            }

            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onprogress = () => {
                const newText = xhr.responseText.substring(seenBytes);
                accumulatedTextRef.current += newText;
                seenBytes = xhr.responseText.length;
            };

            xhr.onload = async () => {
                try {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const assistantResponse = accumulatedTextRef.current;
                        stopStreamingUpdates(false);

                        if (assistantResponse) {
                            console.log('Saving assistant message...');
                            // ✅ استفاده از supabase (ایمپورت شده)
                            const { error: saveAssistantMsgError } = await supabase.from('messages').insert({
                                chat_id: chatId,
                                user_id: userId,
                                role: 'assistant',
                                content: assistantResponse,
                                model: chatSettings.model,
                                image_paths: [],
                                sequence_number: 1
                            });
                            if (saveAssistantMsgError) console.error('Error saving assistant message:', saveAssistantMsgError);
                            else console.log('Assistant message saved.');

                            // ... (بخش آپدیت نام چت) ...
                        } else {
                            // ...
                        }
                    } else {
                        console.error('XHR Error:', xhr.status, xhr.responseText);
                        accumulatedTextRef.current = `خطای سرور ${xhr.status}: ${xhr.responseText || 'خطا'}`;
                        stopStreamingUpdates(true);
                    }
                } catch (onloadError: any) {
                    console.error(">>> FATAL ERROR inside xhr.onload:", onloadError);
                    accumulatedTextRef.current = `خطا در پردازش پاسخ: ${onloadError.message}`;
                    stopStreamingUpdates(true);
                }
            };
            xhr.send(body);
        } catch (err: any) {
            console.error('XHR Setup error:', err);
            accumulatedTextRef.current = `خطا در راه‌اندازی: ${err.message}`;
            stopStreamingUpdates(true);
        }
    };

    // ✅ بخش Render تصحیح شد
    if (isLoadingAuth || (loadingMessages && !initialLoadComplete)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.statusText}>
                        {isLoadingAuth ? "در حال بررسی اطلاعات کاربر..." : "در حال بارگذاری پیام‌ها..."}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ❌ `if (isLoadingUser)` حذف شد

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>
                        کاربر شناسایی نشد. لطفاً خارج شوید.
                    </Text>
                    {/* 👇 This button calls the updated handleLogout */}
                    <Button title="خروج" onPress={handleLogout} color="#FF3B30" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ChatHeader
                    onMenuPress={handleMenuPress}
                    onNewChatPress={handleNewChatPress}
                    onOptionsPress={handleOptionsPress}
                />
                {messages.length === 0 && !currentChatId ? (
                    // Welcome View - This will now center correctly
                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeTitle}>سلام {firstName} 👋</Text>
                        <Text style={styles.welcomeSubtitle}>چطور می‌تونم کمکت کنم؟</Text>
                    </View>
                ) : (
                    // Message List View - This is the correct place for the FlatList
                    <FlatList
                        ref={flatListRef} // Assign ref here
                        style={styles.messageList}
                        data={messages}
                        keyExtractor={(item: IMessage) => item._id.toString()}
                        renderItem={({ item: msg }: { item: IMessage }) => (
                            <View
                                style={[
                                    styles.messageBubble,
                                    msg.user._id === 1 ? styles.userMessage : styles.botMessage,
                                ]}
                            >
                                <Text style={styles.messageText}>{msg.text}</Text>
                            </View>
                        )}
                    />
                )}
                <ChatInput
                    onSendMessage={handleSendMessage}
                    onAttachPress={handleAttachPress}
                    onVoiceInputPress={handleVoiceInputPress}
                    onGPTsPress={handleGPTsPress}
                />
            </View>
        </SafeAreaView>
    );
}

// ... (استایل‌ها بدون تغییر) ...
const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    textInput: {
        backgroundColor: '#222',
        color: '#fff',
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        paddingHorizontal: 15,
        lineHeight: 20,
        marginRight: 10,
        borderRadius: 20,
        marginBottom: Platform.OS === 'ios' ? 0 : 5,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    messageBubble: {
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#2C2C2E',
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#111',
    },
    messageText: {
        color: '#EAEAEA',
        fontSize: 16,
        lineHeight: 25,
    },
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 18,
        color: '#8E8E93', // خاکستری روشن
        textAlign: 'center',
    },
});