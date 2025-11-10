import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    Image,
    ActivityIndicator,
    Text,
    ViewStyle
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DocumentPickerAsset } from 'expo-document-picker';


type RecordingStatus = 'idle' | 'preparing' | 'recording' | 'stopped';
// ۱. تعریف نوع (Type)
type StagedFileState = {
    asset: DocumentPickerAsset;
    status: 'uploading' | 'uploaded' | 'error';
    uploadedPath?: string;
    error?: string;
};

// ۲. رابط (Interface)
interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onAttachPress: () => void;
    onVoiceInputPress: () => void;
    onGPTsPress: () => void;
    stagedImage: string | null;
    onClearStagedImage: () => void;
    stagedFileState: StagedFileState | null;
    onClearStagedFile: () => void;
    isProcessingFile: boolean;
    isTranscribing: boolean;
    recordingStatus: RecordingStatus;
    editText: string | null;
    onEditTextDone: () => void;
    onEditCancel: () => void;
}
const StagedImageView = React.memo(({ stagedImage, onClearStagedImage, isProcessingFile }: {
    stagedImage: string | null;
    onClearStagedImage: () => void;
    isProcessingFile: boolean;
}) => {
    if (!stagedImage) return null;
    return (
        <View style={styles.stagedAttachmentContainer}>
            <Image source={{ uri: stagedImage }} style={styles.stagedImage} />
            <TouchableOpacity
                style={styles.clearStagedButton}
                onPress={onClearStagedImage}
                disabled={isProcessingFile}
            >
                <Icon name="close" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
});

const StagedFileView = React.memo(({ stagedFileState, onClearStagedFile, isProcessingFile }: {
    stagedFileState: StagedFileState | null;
    onClearStagedFile: () => void;
    isProcessingFile: boolean;
}) => {
    if (!stagedFileState) return null;
    // ... (منطق این کامپوننت مثل قبل، بدون تغییر)
    const { asset, status, error } = stagedFileState;
    const effectiveStatus = isProcessingFile ? 'uploading' : status;

    return (
        <View style={[
            styles.stagedAttachmentContainer,
            effectiveStatus === 'error' && styles.stagedAttachmentError
        ]}>
            <View style={styles.stagedFileIcon}>
                {effectiveStatus === 'uploading' && (
                    <ActivityIndicator size="large" color="#fff" />
                )}
                {effectiveStatus === 'uploaded' && (
                    <Icon name="checkmark-circle" size={32} color="#4CAF50" />
                )}
                {effectiveStatus === 'error' && (
                    <Icon name="alert-circle" size={32} color="#F44336" />
                )}
            </View>
            <Text style={styles.stagedFileName} numberOfLines={2} ellipsizeMode="middle">
                {effectiveStatus === 'error' ? (error || 'خطای ناشناخته') :
                    effectiveStatus === 'uploading' ? (status === 'uploading' ? 'در حال آپلود...' : '⏳ در حال پردازش...') :
                        asset.name}
            </Text>
            <TouchableOpacity
                style={styles.clearStagedButton}
                onPress={onClearStagedFile}
                disabled={effectiveStatus === 'uploading'}
            >
                <Icon name="close" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
});

// ✅ تعریف نوار ویرایش (فقط یک بار در سطح بالا)
const EditModeBar = React.memo(({ onEditCancel }: { onEditCancel: () => void }) => {
    return (
        <View style={styles.editBarContainer}>
            <Text style={styles.editBarText}>در حال ویرایش پیام...</Text>
            <TouchableOpacity onPress={onEditCancel} style={styles.editBarCancelButton}>
                <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
        </View>
    );
});

export default function ChatInput({
    onSendMessage,
    onAttachPress,
    onVoiceInputPress,
    onGPTsPress,
    stagedImage,
    onClearStagedImage,
    stagedFileState,
    onClearStagedFile,
    isProcessingFile,
    editText,
    onEditTextDone,
    onEditCancel,
    isTranscribing,
    recordingStatus,
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

    const handleSend = () => {
        onSendMessage(message.trim());
        setMessage('');
        // onEditTextDone() به طور خودکار در useChatLogic فراخوانی می‌شود
    };

    // ✅✅✅ [رفع باگ] فقط یک useEffect برای editText ✅✅✅
    // بلاک تکراری و باگ‌دار قبلی حذف شد
    useEffect(() => {
        if (editText !== null) {
            setMessage(editText);
            // ❌ onEditTextDone();  <- این خط حذف شد تا باگ رفع شود
        } else if (editText === null && message) {
            // (اگر ادیت کنسل شد، متن داخلی را پاک کن)
            setMessage('');
        }
    }, [editText]); // onEditTextDone از وابستگی‌ها حذف شد


    const isLoadingFiles = stagedFileState?.status === 'uploading' || isProcessingFile;
    const isPreparingVoice = recordingStatus === 'preparing' || isTranscribing;
    const isActuallyRecording = recordingStatus === 'recording';
    const isBusy = isLoadingFiles || isTranscribing;

    const canAttach = !stagedImage && !stagedFileState && !isProcessingFile;
    const hasText = message.trim().length > 0;
    const hasAttachment = !!stagedImage || stagedFileState?.status === 'uploaded';
    const canSend = (hasText || hasAttachment) && !isBusy && !isActuallyRecording;

    const inputWrapperStyle = [
        styles.inputWrapper,
        isInputFocused && styles.inputWrapperFocused,
        (isLoadingFiles || isActuallyRecording) && styles.inputWrapperDisabled
    ];

    // ❌ تعریف تکراری EditModeBar از اینجا حذف شد

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.keyboardAvoidingContainer}
        >
            {/* ✅ نوار ویرایش حالا به درستی کار می‌کند */}
            {editText !== null && <EditModeBar onEditCancel={onEditCancel} />}

            <StagedImageView
                stagedImage={stagedImage}
                onClearStagedImage={onClearStagedImage}
                isProcessingFile={isProcessingFile}
            />
            <StagedFileView
                stagedFileState={stagedFileState}
                onClearStagedFile={onClearStagedFile}
                isProcessingFile={isProcessingFile}
            />

            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onAttachPress}
                    disabled={!canAttach}
                >
                    {/* ✅✅✅ [اصلاح UI] آیکون ضمیمه ✅✅✅ */}
                    <Icon
                        name="attach-outline"
                        size={26}
                        color={canAttach ? "#999" : "#333"}
                    />
                </TouchableOpacity>

                <View style={inputWrapperStyle}>
                    <TextInput
                        style={styles.textInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={
                            isActuallyRecording ? "در حال ضبط صدا..." :
                                isTranscribing ? "در حال رونویسی..." :
                                    isProcessingFile ? "⏳ در حال پردازش فایل..." :
                                        editText !== null ? "در حال ویرایش..." :
                                            "Ask RhynoAI"
                        }
                        placeholderTextColor="#777"
                        multiline
                        scrollEnabled={true}
                        editable={!isLoadingFiles && !isActuallyRecording && !isPreparingVoice}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                </View>

                {canSend ? (
                    // --- حالت ارسال ---
                    <TouchableOpacity
                        style={[styles.iconButton, styles.sendButton]}
                        onPress={handleSend}
                    >
                        <Icon name="arrow-up" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                ) : (
                    // --- حالت آماده (صدا و GPTs) ---
                    <View style={styles.actionButtonsContainer}>
                        {isLoadingFiles || isPreparingVoice ? (
                            <ActivityIndicator size="small" color="#999" style={{ paddingHorizontal: 10 }} />
                        ) : isActuallyRecording ? (
                            // --- دکمه توقف ضبط ---
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={onVoiceInputPress}
                            >
                                <Icon name="stop-circle-outline" size={30} color="#FF3B30" />
                            </TouchableOpacity>
                        ) : (
                            // --- دکمه‌های عادی صدا و GPTs ---
                            <>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={onVoiceInputPress}
                                    disabled={isPreparingVoice}
                                >
                                    <Icon name="mic-outline" size={30} color="#999" />
                                </TouchableOpacity>

                                {/* ✅✅✅ [اصلاح UI] آیکون مدل‌ها (GPTs) ✅✅✅ */}
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={onGPTsPress}
                                >
                                    <Icon name="apps-outline" size={26} color="#999" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

// ✅✅✅ [اصلاح UI] استایل‌ها برای تراز عمودی بهتر ✅✅✅
const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        width: '100%',
        backgroundColor: '#000000',
        paddingBottom: Platform.OS === 'ios' ? 0 : 5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center', // ✅ تراز عمودی آیتم‌ها در مرکز
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#333333',
        backgroundColor: '#000000',
    },
    // ✅ دکمه آیکون (برای ضمیمه، میکروفون، و مدل‌ها)
    iconButton: {
        height: 44, // ✅ ارتفاع ثابت هم‌اندازه کادر ورودی
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8, // ✅ پدینگ افقی
    },
    // ✅ دکمه ارسال (آبی)
    sendButton: {
        backgroundColor: '#20a0f0',
        width: 40, // ✅ کمی کوچکتر
        height: 40, // ✅
        borderRadius: 20, // ✅ دایره کامل
        marginLeft: 5,
        paddingHorizontal: 0, // ریست پدینگ
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center', // ✅ تراز متن در مرکز
        backgroundColor: '#1C1C1E',
        borderRadius: 22, // ✅ گردتر
        marginHorizontal: 8,
        minHeight: 44, // ✅ ارتفاع ثابت
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#333',
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        fontSize: 16,
        color: 'white',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10, // ✅ پدینگ عمودی متوازن
        lineHeight: 22,
    },

    // --- استایل‌های ضمیمه ---
    stagedAttachmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 70,
        borderRadius: 15,
        margin: 10,
        marginLeft: 45,
        marginBottom: -5,
        backgroundColor: '#333',
        alignSelf: 'flex-start',
        padding: 5,
        paddingRight: 35,
        maxWidth: '80%',
    },
    stagedImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },
    stagedFileIcon: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stagedFileName: {
        color: 'white',
        fontSize: 16,
        marginLeft: 10,
        flexShrink: 1,
    },
    clearStagedButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    stagedAttachmentError: {
        backgroundColor: '#5D2A2A',
        borderColor: '#F44336',
        borderWidth: 1,
    },

    // --- نوار ویرایش ---
    editBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#333',
    },
    editBarText: {
        color: '#EAEAEA',
        fontSize: 14,
        fontFamily: 'Vazirmatn-Medium',
    },
    editBarCancelButton: {
        padding: 5,
    },

    // --- استایل‌های داینامیک ---
    inputWrapperFocused: {
        borderColor: '#20a0f0',
        backgroundColor: '#222',
    },
    inputWrapperDisabled: {
        backgroundColor: '#111',
    },
    // ✅ کانتینر دکمه‌های راست
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44, // ✅ ارتفاع ثابت
    },
});