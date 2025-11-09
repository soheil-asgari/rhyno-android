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
    Text
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
    isTranscribing,
    recordingStatus,
}: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        onSendMessage(message.trim());
        setMessage('');
    };
    useEffect(() => {
        if (editText !== null) {
            setMessage(editText); // ۱. متن داخلی اینپوت را آپدیت کن
            onEditTextDone(); // ۲. به والد بگو که کار تمام شد
        }
    }, [editText, onEditTextDone]);
    // --- کامپوننت‌های کمکی ---
    const isLoadingFiles = stagedFileState?.status === 'uploading' || isProcessingFile;
    const isPreparingVoice = recordingStatus === 'preparing' || isTranscribing;
    const isActuallyRecording = recordingStatus === 'recording';
    const isBusy = isLoadingFiles || isTranscribing;
    // --- منطق دکمه‌ها ---
    const canAttach = !stagedImage && !stagedFileState && !isProcessingFile;
    const canSend = (message.trim().length > 0 || !!stagedImage || (stagedFileState?.status === 'uploaded')) && !isBusy && !isActuallyRecording;
    const isLoading = stagedFileState?.status === 'uploading' || isProcessingFile;
    const showVoiceButton = !message.trim() && !stagedImage && !stagedFileState && !isLoadingFiles;
    // --- return ---
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.keyboardAvoidingContainer}
        >
            {/* ✅ حالا از کامپوننت‌های بهینه‌شده بیرونی استفاده می‌کنیم */}
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
                    disabled={!canAttach} // ✅ منطق جدید
                >
                    <Icon
                        name="add-circle-outline"
                        size={28}
                        color={canAttach ? "#999" : "#333"} // ✅ منطق جدید
                    />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={
                            isActuallyRecording ? "در حال ضبط صدا..." : // ✅ حالت ضبط
                                isTranscribing ? "در حال رونویسی..." : // ✅ حالت رونویسی
                                    isProcessingFile ? "⏳ در حال پردازش فایل..." :
                                        stagedFileState?.status === 'uploading' ? "در حال آپلود فایل..." :
                                            stagedFileState?.status === 'uploaded' ? "فایل آپلود شد. ارسال برای پردازش..." :
                                                stagedFileState?.status === 'error' ? "خطا در آپلود. دوباره تلاش کنید." :
                                                    stagedImage ? "افزودن متن به عکس..." :
                                                        "Ask RhynoAI"
                        }
                        placeholderTextColor="#777"
                        multiline
                        scrollEnabled={true}
                        returnKeyType="send"
                        onEndEditing={handleSend}
                        editable={!isBusy && !isActuallyRecording} // ✅ غیرفعال هنگام کار
                    />

                    {/* ✅✅✅ منطق هوشمند میکروفون ✅✅✅ */}
                    {showVoiceButton && (
                        <TouchableOpacity
                            style={styles.sendVoiceButton}
                            onPress={onVoiceInputPress}
                            // در هر دو حالت آماده‌سازی و رونویسی غیرفعال شود
                            disabled={isPreparingVoice}
                        >
                            {isPreparingVoice ? ( // ✅ (شامل preparing و transcribing)
                                <ActivityIndicator size="small" color="#999" /> // اسپینر
                            ) : isActuallyRecording ? ( // ✅ (فقط در حال ضبط)
                                <Icon name="stop-circle-outline" size={28} color="#FF3B30" /> // آیکون قرمز توقف
                            ) : (
                                <Icon name="mic-outline" size={28} color="#999" /> // آیکون پیش‌فرض
                            )}
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={canSend ? handleSend : onGPTsPress}
                    disabled={isBusy || isActuallyRecording} // ✅ غیرفعال هنگام کار
                >
                    {isBusy ? ( // ✅ اسپینر برای فایل و رونویسی
                        <ActivityIndicator size="small" color="#999" />
                    ) : canSend ? (
                        <Icon name="arrow-up-circle" size={40} color="#20a0f0" />
                    ) : (
                        <MaterialCommunityIcons name="dots-circle" size={28} color="#999999" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ... (استایل‌ها) ...
const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        width: '100%',
        backgroundColor: '#000000',
        paddingBottom: Platform.OS === 'ios' ? 0 : 5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#333333',
        backgroundColor: '#000000',
    },
    iconButton: { // دکمه‌های + و GPTs/ارسال
        paddingHorizontal: 5,
        paddingBottom: Platform.OS === 'ios' ? 8 : 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: { // کانتینر اصلی وسط
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#202020',
        borderRadius: 25,
        marginHorizontal: 8,
        minHeight: Platform.OS === 'ios' ? 41 : 50,
        paddingVertical: Platform.OS === 'ios' ? 0 : 0,
    },
    textInput: { // کادر متن
        flex: 1,
        maxHeight: 120,
        minHeight: 35,
        fontSize: 16,
        color: 'white',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 8 : 10,
        paddingBottom: Platform.OS === 'ios' ? 8 : 10,
        lineHeight: 22,
    },
    sendVoiceButton: { // دکمه میکروفون/ارسال (داخل کادر)
        paddingRight: 10,
        paddingLeft: 5,
        paddingBottom: Platform.OS === 'ios' ? 8 : 10, // تراز با متن
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- استایل‌های ضمیمه (مشترک برای عکس و فایل) ---
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
        paddingRight: 35, // جا برای دکمه X
        maxWidth: '80%', // جلوگیری از سرریز شدن
    },
    stagedImage: {
        width: 60, // کمی کوچکتر از کانتینر
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
        flexShrink: 1, // اجازه می‌دهد متن کوچک شود
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
    // استایل خطا
    stagedAttachmentError: {
        backgroundColor: '#5D2A2A', // پس‌زمینه قرمز تیره برای خطا
        borderColor: '#F44336',
        borderWidth: 1,
    },
});

