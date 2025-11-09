// src/components/MessageItem.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';
import { DocumentPickerAsset } from 'expo-document-picker';

// ابزارهایی که در فاز ۱ ساختیم
import { isRTL } from '../utils/chatUtils';
import { markdownStyles } from '../styles/markdownStyles';
import TypingIndicator from './TypingIndicator';
import CopyableCodeBlock from './CopyableCodeBlock';
import { AudioPlayer } from './AudioPlayer';


// استایل‌های ثابت را به انتهای فایل منتقل کردیم
import { messageItemStyles as styles } from '../styles/messageItemStyles';

// تعریف نوع داده برای فایل ضمیمه
type MessageWithFile = IMessage & {
    fileAsset?: DocumentPickerAsset | null;
    isTyping?: boolean;
    audio?: string;

};

// تعریف Props کامپوننت
type MessageItemProps = {
    msg: IMessage;
    index: number;
    lastUserMessageId?: string | number | null;
    lastBotMessageId?: string | number | null;
    onOpenImage: (uri: string) => void;
    onCopyMessage: (text: string) => void;
    onEditMessage: (msg: IMessage) => void;
    onRegenerate: (index: number) => void;
    isLastInGroup: boolean;
    isSending: boolean;
};

// قوانین مارک‌داون برای بلاک کد
const markdownRules = {
    fence: (props: any) => (
        <CopyableCodeBlock key={props.key} content={props.content} attributes={props.attributes} />
    ),
    code_block: (props: any) => (
        <CopyableCodeBlock key={props.key} content={props.content} attributes={props.attributes} />
    ),
};

const MessageItem = ({
    msg,
    index,
    lastUserMessageId,
    lastBotMessageId,
    onOpenImage,
    onCopyMessage,
    onEditMessage,
    onRegenerate,
    isSending,
    isLastInGroup
}: MessageItemProps) => {

    // 1. متغیرهای اساسی پیام
    const msgWithFile = msg as MessageWithFile;
    const isUser = msg.user._id === 1;
    const isMsgSending = isUser && isSending && msg._id.toString().startsWith('user-');
    const isTyping = msgWithFile.isTyping === true;

    // 2. بهینه‌سازی با useMemo:
    //    این محاسبات فقط زمانی تکرار می‌شوند که متن پیام (msg.text) یا عکس (msg.image) تغییر کند.
    const { textContent, finalImageUri, isTextRTL } = useMemo(() => {
        const SEPARATOR = '%RHINO_IMAGE_SEPARATOR%';
        let text = msg.text || '';
        let imageUriFromText: string | null = null;

        // منطق ۱: (جداکننده %RHINO%) - بدون تغییر
        if (text.includes(SEPARATOR)) {
            // ... (این بخش مثل قبل باقی می‌ماند)
            const parts = text.split(SEPARATOR);
            text = parts[0]?.replace(/%$/, '').trim();
            let imageData = parts[1]?.replace(/%$/, '').trim();
            if (imageData?.startsWith('http') || imageData?.startsWith('data:image')) {
                imageUriFromText = imageData;
            } else if (imageData && imageData.length > 50) {
                imageUriFromText = `data:image/png;base64,${imageData}`;
            } else {
                text = text || msg.text.replace(/%RHINO_IMAGE_SEPARATOR%/g, '');
            }

            // ✅✅✅✅✅ شروع اصلاح منطق ۲ (Fallback) ✅✅✅✅✅
            // (قبلاً بود: else if (msg.user._id === 2 && text.length > 200 && !text.includes(' ') && !text.includes('\n')))
        } else if (msg.user._id === 2 && text.length > 200) {

            // ۱. ابتدا تمام خطوط جدید (newlines) را حذف می‌کنیم
            const potentialBase64 = text.replace(/\n/g, '');

            // ۲. حالا بررسی می‌کنیم که آیا "فضای خالی" دارد یا نه
            //    (رشته base64 خالص نباید space داشته باشد)
            if (!potentialBase64.includes(' ')) {
                // اگر space نداشت، این یک عکس است
                imageUriFromText = `data:image/png;base64,${potentialBase64}`;
                text = ''; // متن را خالی می‌کنیم تا نمایش داده نشود
            }
            // اگر space داشت، احتمالاً یک متن طولانی معمولی است
            // پس هیچ کاری نمی‌کنیم و اجازه می‌دهیم به عنوان متن رندر شود.
        }
        // ✅✅✅✅✅ پایان اصلاح منطق ۲ ✅✅✅✅✅

        const finalImage = msg.image || imageUriFromText;
        const rtl = isRTL(text);

        return {
            textContent: text.trim(),
            finalImageUri: finalImage,
            isTextRTL: rtl,
        };
    }, [msg.text, msg.image, msg.user._id]);

    // 3. بهینه‌سازی استایل‌های مارک‌داون با useMemo
    const memoizedMarkdownStyles = useMemo(
        () => markdownStyles(isTextRTL, isUser),
        [isTextRTL, isUser]
    );

    // 4. متغیرهای نمایش
    const showFile = msgWithFile.fileAsset && isUser;
    const showText = textContent.length > 0;
    const isLastUserMessage = msg._id === lastUserMessageId;
    const isLastBotMessage = msg._id === lastBotMessageId;

    // 5. هندلرهای داخلی
    //    این توابع از props بیرونی استفاده می‌کنند
    const handleCopy = () => onCopyMessage(textContent);
    const handleEdit = () => onEditMessage(msg);
    const handleRegen = () => onRegenerate(index);
    const handleImagePress = () => finalImageUri && onOpenImage(finalImageUri);

    return (
        <Animated.View style={[
            { marginBottom: 5 },
            isMsgSending && { opacity: 0.6 } // ✅✅✅ خط جدید
        ]}
            entering={FadeIn.duration(300)}
        >
            {/* ردیف پیام (برای چینش راست/چپ) */}
            <View
                style={[
                    styles.messageRow,
                    isUser ? styles.userMessageRow : styles.botMessageRow
                ]}
            >
                {/* حباب پیام (با گوشه‌های چسبنده) */}
                <View style={[
                    styles.messageBubbleBase, // (این حالا borderRadius پیش‌فرض را دارد)
                    isUser ? styles.userMessage : styles.botMessage,

                    // ✅✅✅ منطق شرطی جدید ✅✅✅
                    // فقط اگر آخرین پیام در گروه باشد، استایل "گوشه تیز" را اعمال کن
                    isLastInGroup && (
                        isUser
                            ? (isTextRTL ? styles.userBubbleRTL : styles.userBubbleLTR)
                            : (isTextRTL ? styles.botBubbleRTL : styles.botBubbleLTR)
                    )
                ]} >

                    {/* --- محتوای حباب --- */}
                    {showFile && (
                        <View style={styles.fileInMessageBubble}>
                            <Icon name="document-text" size={24} color={isUser ? "#FFFFFF" : "#EAEAEA"} style={{ marginRight: 10 }} />
                            <Text style={[styles.fileInMessageText, isUser && { color: "#FFFFFF" }]} numberOfLines={2} ellipsizeMode="middle">
                                {msgWithFile.fileAsset!.name}
                            </Text>
                        </View>
                    )}
                    {msgWithFile.audio && (
                        <AudioPlayer uri={msgWithFile.audio} />
                    )}

                    {isTyping && !showText && !finalImageUri && !msgWithFile.audio && (
                        <TypingIndicator />
                    )}
                    {showText && (
                        <Markdown
                            style={memoizedMarkdownStyles}
                            rules={markdownRules}
                        >
                            {textContent}
                        </Markdown>
                    )}
                    {finalImageUri && (
                        <TouchableOpacity onPress={handleImagePress}>
                            <Image
                                source={{ uri: finalImageUri }}
                                style={[styles.imageInMessage, !showText && { marginTop: 0 }]}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* --- دکمه‌های اکشن --- */}
            {!isTyping && (
                <View style={[
                    styles.actionButtonContainer,
                    isUser ? styles.userMessageRow : styles.botMessageRow
                ]}>
                    {isUser ? (
                        <>
                            {isLastUserMessage && (
                                <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                                    <Icon name="pencil-outline" size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                            {showText && (
                                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                                    <Icon name="copy-outline" size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <>
                            {isLastBotMessage && (
                                <TouchableOpacity onPress={handleRegen} style={styles.actionButton}>
                                    <Icon name="refresh-outline" size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                            {showText && (
                                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                                    <Icon name="copy-outline" size={16} color="#999" />
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}
        </Animated.View>
    );
};

// ✅✅✅ جادوی اصلی اینجاست: React.memo ✅✅✅
// این کامپوننت فقط زمانی رندر می‌شود که propsهایش (مثل msg.id) تغییر کنند.
export default React.memo(MessageItem);