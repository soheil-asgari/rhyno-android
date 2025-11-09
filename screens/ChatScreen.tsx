// src/screens/ChatScreen.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Button,
    Text,
    View,
    ActivityIndicator,
    Platform,
    FlatList,
    Alert,
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
// کامپوننت‌های UI
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import { VoiceUI } from '../components/VoiceUI';
import MessageItem from '../components/MessageItem'; // ✅ ایمپورت شد

// هوک منطق اصلی
import { useChatLogic } from '../hooks/useChatLogic'; // ✅✅✅ ایمپورت شد

// استایل‌ها
import { styles } from '../styles/ChatScreen.styles'; // ✅ ایمپورت شد
import { useChat } from '../context/ChatContext';

// (تعریف Type های ناوبری)
import type { DrawerNavigationType } from './Navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import WelcomePrompts from '../components/WelcomePrompts';
import { LLMID } from '../types/llms';


// ----------------------------------------------------------------
//
//                 🔥 کامپوننت ChatScreen 🔥
//
// ----------------------------------------------------------------

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
        onClearStagedImage, onClearStagedFile, onEditTextDone, messages,
    } = useChatLogic();

    // (وابستگی‌های Context/Navigation که هوک به آن‌ها نیاز ندارد)
    const navigation = useNavigation<DrawerNavigationType>();
    const { setCurrentChatId, setSelectedModel, selectedModel, currentChatId } = useChat();

    // State محلی فقط برای UI (مدال تصویر)
    const [isImageModalVisible, setImageModalVisible] = useState(false);
    const [modalImageUri, setModalImageUri] = useState<string | null>(null);

    // Ref محلی فقط برای UI (لیست)
    const flatListRef = useRef<FlatList<IMessage>>(null);
    const lastMessageText = messages.length > 0 ? messages[messages.length - 1].text : null;
    //
    // === هندلرهای ناوبری و UI ===
    //
    const handlePromptClick = (promptText: string, modelId?: LLMID | string) => { // ✅✅✅
        // ۲. هر دو پارامتر را به handleSendMessage ارسال کنید
        handleSendMessage(promptText, modelId); // ✅✅✅
    };
    const handleMenuPress = useCallback(() => navigation.openDrawer(), [navigation]);

    const handleNewChatPress = useCallback(() => {
        if (setCurrentChatId) {
            setCurrentChatId(undefined);
            navigation.navigate('Chat', { chatId: undefined });
        }
    }, [navigation, setCurrentChatId]);

    const handleOptionsPress = useCallback(() => {
        Alert.alert("تنظیمات چت", currentChatName || "گزینه‌های این چت", [
            { text: 'اشتراک‌گذاری چت (بزودی)', onPress: () => { }, style: 'default' },
            { text: 'حذف این چت (بزودی)', onPress: () => { }, style: 'destructive' },
            { text: 'انصراف', style: 'cancel' },
        ]);
    }, [currentChatName]);

    const handleGPTsPress = useCallback(() => {
        if (setSelectedModel) {
            setSelectedModel("gpt-4o-mini-realtime-preview-2024-12-17");
            handleNewChatPress();
            // ... (Toast)
        }
    }, [setSelectedModel, handleNewChatPress]);

    const handleVoiceStop = useCallback(() => {
        if (setSelectedModel) setSelectedModel("gpt-4o-mini");
        handleNewChatPress();
        Alert.alert('مکالمه پایان یافت', 'به حالت چت متنی بازگشتید.');
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
        // ... (کد دانلود تصویر از فایل اصلی شما - بدون تغییر)
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
        // ... (کد اشتراک‌گذاری تصویر از فایل اصلی شما - بدون تغییر)
        if (!modalImageUri) return;
        try {
            let shareUri = modalImageUri;
            if (modalImageUri.startsWith('data:')) {
                // (برای 'react-native-share' شاید نیاز باشد به فایل موقت تبدیل شود)
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

    // ۲. حالت خطا (کاربر لاگین نیست)
    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}> کاربر شناسایی نشد. </Text>
                    {/* (دکمه خروج را اینجا اضافه کنید) */}
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
                chatSettings={{ model: selectedModel || '' }} // (از Context گرفته شود)
                onStop={handleVoiceStop}
                supabaseToken={session.access_token}
            />
        );
    }

    // ۴. حالت چت متنی اصلی
    return (
        // <SafeAreaView style={styles.safeArea}>
        <SafeAreaView style={styles.container}>
            <ChatHeader
                onMenuPress={handleMenuPress}
                onNewChatPress={handleNewChatPress}
                onOptionsPress={handleOptionsPress}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            // (اگر از `KeyboardAvoidingView` راضی نیستید، می‌توانید از `react-native-keyboard-aware-scroll-view` استفاده کنید)
            >
                {messages.length === 0 && !currentChatId ? (

                    // ✅✅✅ صفحه خوشامدگویی جدید ✅✅✅
                    <View style={styles.welcomeContainer}>

                        {/* ۱. لوگوی شما (اختیاری) */}
                        <Image
                            source={require('../assets/rhyno_white.png')} // ❗️ مسیر لوگوی خود را اینجا بگذارید
                            style={styles.welcomeLogo}
                        />

                        {/* ۲. متن خوشامدگویی */}
                        <Text style={styles.welcomeTitle}>سلام {firstName} 👋</Text>
                        <Text style={styles.welcomeSubtitle}>چطور می‌تونم کمکت کنم؟</Text>

                        {/* ۳. کامپوننت پیشنهادات */}
                        <WelcomePrompts onPromptClick={handlePromptClick} />

                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        style={styles.messageList}
                        data={messages}
                        keyExtractor={(item: IMessage) => item._id.toString()}
                        renderItem={renderMessageItem} // ✅ تابع بهینه‌شده
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()} // (اسکرول به انتها)
                        onLayout={() => flatListRef.current?.scrollToEnd()} // (اسکرول به انتها)
                        ListFooterComponent={<View style={{ height: 100 }} />} // (کمی فضا در انتها)
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

                {/* ورودی چت */}
                <ChatInput
                    key={inputKey}
                    onSendMessage={handleSendMessage}
                    onAttachPress={handleAttachPress}
                    onVoiceInputPress={handleVoiceInputPress}
                    onGPTsPress={handleGPTsPress}
                    stagedImage={stagedImage}
                    onClearStagedImage={onClearStagedImage}
                    stagedFileState={stagedFileState as any} // (Type cast)
                    onClearStagedFile={onClearStagedFile}
                    isProcessingFile={isProcessingFile}
                    recordingStatus={recordingStatus}
                    isTranscribing={isTranscribing}
                    editText={editText}
                    onEditTextDone={onEditTextDone}
                />

            </KeyboardAvoidingView>


        </SafeAreaView >

    );
}