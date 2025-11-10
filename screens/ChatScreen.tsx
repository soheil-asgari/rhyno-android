// src/screens/ChatScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Button,
    Text,
    View,
    ActivityIndicator,
    Platform,
    FlatList,
    Alert, // (دیگر برای handleOptionsPress لازم نیست، اما شاید جای دیگری لازم باشد)
    Image,
    Modal,
    TouchableOpacity,
    KeyboardAvoidingView,
} from 'react-native';
import { IMessage } from 'react-native-gifted-chat';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { useActionSheet } from '@expo/react-native-action-sheet'; // ✅✅✅ ایمپورت جدید

// کامپوننت‌های UI
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import { VoiceUI } from '../components/VoiceUI';
import MessageItem from '../components/MessageItem';

// هوک منطق اصلی
import { useChatLogic } from '../hooks/useChatLogic';

// استایل‌ها
import { styles } from '../styles/ChatScreen.styles';
import { useChat } from '../context/ChatContext';

// (تعریف Type های ناوبری)
import type { DrawerNavigationType } from '../types/navigation.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import WelcomePrompts from '../components/WelcomePrompts';
import { LLMID } from '../types/llms';
import { LinearGradient } from 'expo-linear-gradient';
import { AttachmentModal } from '../components/AttachmentModal';
import { CommonActions } from '@react-navigation/native';
import { useAndroidBackHandler } from './Navigation';




export default function ChatScreen() {

    // ✅ ۱. تمام منطق، state و اکشن‌ها از هوک می‌آید
    const {
        // State & Data
        stagedFileState, stagedImage, editText, isSending,
        loadingMessages, initialLoadComplete, isProcessingFile,
        isTranscribing, recordingStatus, currentChatName, inputKey, firstName,
        isRealtime, session, isLoadingAuth, user,
        lastUserMessageId, lastBotMessageId,

        // Action Handlers
        handleSendMessage, handleAttachPress, handleVoiceInputPress,
        handleCopyMessage, handleEditMessage, handleRegenerate,

        // Setters (برای ChatInput)
        onClearStagedImage, onClearStagedFile, onEditTextDone, messages, onEditCancel, handleVoiceStop, handleDeleteChat, isAttachModalVisible,
        onModalOptionPress,
        onCloseAttachModal,
    } = useChatLogic();

    // (وابستگی‌های Context/Navigation که هوک به آن‌ها نیاز ندارد)
    const navigation = useNavigation<DrawerNavigationType>();
    useAndroidBackHandler(navigation);
    const { setCurrentChatId, setSelectedModel, selectedModel, currentChatId } = useChat();
    const { showActionSheetWithOptions } = useActionSheet(); // ✅✅✅ هوک ActionSheet

    // State محلی فقط برای UI (مدال تصویر)
    const [isImageModalVisible, setImageModalVisible] = useState(false);
    const [modalImageUri, setModalImageUri] = useState<string | null>(null);

    // Ref محلی فقط برای UI (لیست)
    const flatListRef = useRef<FlatList<IMessage>>(null);
    const lastMessageText = messages.length > 0 ? messages[messages.length - 1].text : null;
    //
    // === هندلرهای ناوبری و UI ===
    //
    const handlePromptClick = (promptText: string, modelId?: LLMID | string) => {
        handleSendMessage(promptText, modelId);
    };
    const handleMenuPress = useCallback(() => navigation.openDrawer(), [navigation]);

    const handleNewChatPress = useCallback(() => {
        if (setCurrentChatId) {
            setCurrentChatId(undefined);
            navigation.navigate('Chat', { chatId: undefined });
        }
    }, [navigation, setCurrentChatId]);


    const handleShareChat = useCallback(async () => {
        if (!messages || messages.length === 0) {
            Toast.show({ type: 'info', text1: 'چتی برای اشتراک‌گذاری وجود ندارد' });
            return;
        }

        // ۱. فرمت کردن پیام‌ها به یک رشته متنی
        let formattedChat = `چت راینو ${currentChatName ? `(${currentChatName})` : ''}:\n\n`;
        messages.forEach(msg => {
            // با فرض اینکه user.id شناسه کاربر فعلی است
            const sender = (user && msg.user._id === user.id) ? (firstName || 'شما') : 'راینو';
            formattedChat += `${sender}:\n${msg.text}\n\n`;
        });

        // ۲. باز کردن پنجره اشتراک‌گذاری نیتیو
        try {
            await Share.open({
                title: `اشتراک‌گذاری چت: ${currentChatName || 'Rhyno'}`,
                message: formattedChat,
                subject: `چت با راینو` // (برای اشتراک‌گذاری در ایمیل)
            });
        } catch (error: any) {
            if (error.message.includes('User did not share')) {
                // این خطا نیست، کاربر خودش پنجره را بسته
            } else {
                console.error('خطا در اشتراک‌گذاری:', error);
                Alert.alert('خطا', 'خطا در اشتراک‌گذاری چت.');
            }
        }
    }, [messages, currentChatName, user, firstName]);
    const confirmDeleteChat = () => {
        Alert.alert(
            "حذف چت", // عنوان
            "آیا از حذف این چت مطمئن هستید؟ این عمل قابل بازگشت نیست.", // پیام
            [
                {
                    text: 'انصراف', // دکمه انصراف
                    style: 'cancel',
                },
                {
                    text: 'حذف کن', // دکمه حذف
                    style: 'destructive',
                    onPress: async () => { // ✅ async می‌ماند
                        if (!currentChatId || !handleDeleteChat) { // ✅ handleDeleteChat هم چک شود
                            Toast.show({ type: 'error', text1: 'خطا', text2: 'شناسه چت یافت نشد' });
                            return;
                        }

                        try {
                            // --- اینجا تغییر اصلی است ---
                            // ۱. تابع واقعی حذف را فراخوانی کن
                            await handleDeleteChat();

                            // ۲. به کاربر اطلاع بده
                            Toast.show({ type: 'success', text1: 'چت با موفقیت حذف شد' });

                            // ۳. به چت جدید هدایت کن
                            if (setCurrentChatId) {
                                setCurrentChatId(undefined);
                                navigation.navigate('Chat', { chatId: undefined });
                            }

                        } catch (error: any) {
                            console.error('خطا در حذف چت:', error);
                            Toast.show({ type: 'error', text1: 'خطا در حذف چت', text2: error.message });
                        }
                    },
                },
            ]
        );
    };
    const handleOptionsPress = useCallback(() => {
        // ۱. گزینه‌ها (بدون "بزودی")
        const options = ['اشتراک‌گذاری چت', 'حذف این چت', 'انصراف'];
        const destructiveButtonIndex = 1; // 'حذف این چت'
        const cancelButtonIndex = 2; // 'انصراف'

        showActionSheetWithOptions(
            {
                title: currentChatName || "گزینه‌های این چت",
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                // استایل‌های سفارشی برای حالت تیره
                containerStyle: { backgroundColor: '#1C1C1E' },
                textStyle: { color: '#FFF', fontFamily: 'Vazirmatn-Medium' },
                titleTextStyle: { color: '#8E8E93', fontFamily: 'Vazirmatn-Medium' },
            },
            (selectedIndex?: number) => {
                // ۲. بر اساس دکمه کلیک شده اقدام کنید
                switch (selectedIndex) {
                    case 0:
                        handleShareChat(); // ⬅️ فراخوانی تابع اشتراک‌گذاری
                        break;
                    case 1:
                        confirmDeleteChat(); // ⬅️ فراخوانی تابع تایید حذف
                        break;
                    case 2:
                    default:
                        // 'انصراف' or pressing outside
                        break;
                }
            }
        );
    }, [
        currentChatName,
        showActionSheetWithOptions,
        handleShareChat, // ⬅️ وابستگی جدید
        handleDeleteChat,
        currentChatId,  // ⬅️ وابستگی جدید
        setCurrentChatId, // ⬅️ وابستگی جدید
        navigation // ⬅️ وابستگی جدید
    ]);

    const handleGPTsPress = useCallback(() => {
        if (setSelectedModel) {
            setSelectedModel("gpt-4o-mini-realtime-preview-2024-12-17");
            handleNewChatPress();
            // ... (Toast)
        }
    }, [setSelectedModel, handleNewChatPress]);


    //
    // === هندلرهای مدال تصویر ===
    //
    const openImageModal = useCallback((uri: string) => {
        setModalImageUri(uri);
        setImageModalVisible(true);
    }, []);

    const closeImageModal = useCallback(() => {
        setImageModalVisible(false);
        setModalImageUri(null);
    }, []);

    const downloadImage = useCallback(async () => {
        // ... (کد دانلود تصویر - بدون تغییر)
        if (!modalImageUri) return;
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') throw new Error('اجازه دسترسی به گالری داده نشد.');

            const fileUri = FileSystem.cacheDirectory + `${Date.now()}.png`;
            if (modalImageUri.startsWith('data:')) {
                const base64Data = modalImageUri.split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
            } else {
                await FileSystem.downloadAsync(modalImageUri, fileUri);
            }
            await MediaLibrary.saveToLibraryAsync(fileUri);
            Toast.show({ type: 'success', text1: "با موفقیت ذخیره شد" });
            closeImageModal();
        } catch (error: any) {
            Alert.alert('خطا', 'خطا در ذخیره عکس: ' + error.message);
        }
    }, [modalImageUri, closeImageModal]);

    const shareImage = useCallback(async () => {
        // ... (کد اشتراک‌گذاری تصویر - بدون تغییر)
        if (!modalImageUri) return;
        try {
            let shareUri = modalImageUri;
            if (modalImageUri.startsWith('data:')) {
                const fileUri = FileSystem.cacheDirectory + `share_${Date.now()}.png`;
                const base64Data = modalImageUri.split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
                shareUri = fileUri;
            }
            await Share.open({ url: shareUri, title: 'اشتراک‌گذاری تصویر' });
        } catch (error: any) {
            Alert.alert('خطا', 'خطا در اشتراک‌گذاری: ' + error.message);
        }
    }, [modalImageUri]);

    //
    // === رندر FlatList ===
    //
    const renderMessageItem = useCallback(({ item, index }: { item: IMessage; index: number }) => {
        const nextMessage = messages[index + 1];
        const isLastInGroup = !nextMessage || nextMessage.user._id !== item.user._id;
        return (
            <MessageItem
                msg={item}
                index={index}
                isLastInGroup={isLastInGroup}
                isSending={isSending}
                lastUserMessageId={lastUserMessageId}
                lastBotMessageId={lastBotMessageId}
                onOpenImage={openImageModal}
                onCopyMessage={handleCopyMessage}
                onEditMessage={handleEditMessage}
                onRegenerate={handleRegenerate}
            />
        );
    }, [
        messages,
        isSending,
        lastUserMessageId,
        lastBotMessageId,
        openImageModal,
        handleCopyMessage,
        handleEditMessage,
        handleRegenerate
    ]);

    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, lastMessageText]);

    // ۱. حالت لودینگ اولیه
    if (isLoadingAuth || (loadingMessages && !initialLoadComplete)) {
        return (
            <LinearGradient
                colors={['#050505', '#000000']}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.statusText}>
                            {isLoadingAuth ? "در حال بررسی اطلاعات کاربر..." : "در حال بارگذاری پیام‌ها..."}
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // ۲. حالت خطا (کاربر لاگین نیست)
    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}> کاربر شناسایی نشد. </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ۳. حالت چت صوتی Realtime
    if (isRealtime) {
        if (!session || !session.access_token) {
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <Text style={styles.errorText}>خطا: سشن کاربر یافت نشد.</Text>
                        <Button title="بازگشت به چت" onPress={handleVoiceStop} color="#FF3B30" />
                    </View>
                </SafeAreaView>
            );
        }
        return (
            <VoiceUI
                chatSettings={{ model: selectedModel || '' }}
                onStop={handleVoiceStop}
                supabaseToken={session.access_token}
            />
        );
    }

    // ۴. حالت چت متنی اصلی
    return (

        <LinearGradient
            colors={['#050505', '#000000']}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <ChatHeader
                    onMenuPress={handleMenuPress}
                    onNewChatPress={handleNewChatPress}
                    onOptionsPress={handleOptionsPress} // ✅ این تابع اکنون بهینه‌ شده است
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {messages.length === 0 && !currentChatId ? (
                        <View style={styles.welcomeContainer}>
                            <Image
                                source={require('../assets/rhyno_white.png')}
                                style={styles.welcomeLogo}
                            />
                            <Text style={styles.welcomeTitle}>سلام {firstName} 👋</Text>
                            <Text style={styles.welcomeSubtitle}>چطور می‌تونم کمکت کنم؟</Text>
                            <WelcomePrompts onPromptClick={handlePromptClick} />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            style={styles.messageList}
                            data={messages}
                            keyExtractor={(item: IMessage) => item._id.toString()}
                            renderItem={renderMessageItem}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                            onLayout={() => flatListRef.current?.scrollToEnd()}
                            ListFooterComponent={<View style={{ height: 100 }} />}
                        />
                    )}

                    {/* مدال تصویر */}
                    <Modal
                        visible={isImageModalVisible}
                        transparent={true}
                        onRequestClose={closeImageModal}
                    >
                        <View style={styles.imageModalBackground}>
                            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
                                <Text style={styles.closeButtonText}>X</Text>
                            </TouchableOpacity>
                            {modalImageUri && (
                                <Image
                                    source={{ uri: modalImageUri }}
                                    style={styles.fullScreenImage}
                                    resizeMode="contain"
                                />
                            )}
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalActionButton} onPress={downloadImage}>
                                    <Text style={styles.modalActionButtonText}>دانلود</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalActionButton} onPress={shareImage}>
                                    <Text style={styles.modalActionButtonText}>اشتراک‌گذاری</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                    <AttachmentModal
                        isVisible={isAttachModalVisible}
                        onClose={onCloseAttachModal}
                        onSelectOption={onModalOptionPress}
                    />
                    {/* ورودی چت */}
                    <ChatInput
                        key={inputKey}
                        onSendMessage={handleSendMessage}
                        onAttachPress={handleAttachPress}
                        onVoiceInputPress={handleVoiceInputPress}
                        onGPTsPress={handleGPTsPress}
                        stagedImage={stagedImage}
                        onClearStagedImage={onClearStagedImage}
                        stagedFileState={stagedFileState as any}
                        onClearStagedFile={onClearStagedFile}
                        isProcessingFile={isProcessingFile}
                        recordingStatus={recordingStatus}
                        isTranscribing={isTranscribing}
                        editText={editText}
                        onEditTextDone={onEditTextDone}
                        onEditCancel={onEditCancel}
                    />

                </KeyboardAvoidingView>


            </SafeAreaView >
        </LinearGradient>
    );
}