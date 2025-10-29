// components/ChatInput.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView } from 'react-native';
// اگر از Expo استفاده می‌کنید:
// import { Ionicons as Icon } from '@expo/vector-icons';
// اگر از Bare React Native CLI استفاده می‌کنید:
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onAttachPress: () => void;
    onVoiceInputPress: () => void;
    onGPTsPress: () => void;
}

export default function ChatInput({
    onSendMessage,
    onAttachPress,
    onVoiceInputPress,
    onGPTsPress,
}: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.keyboardAvoidingContainer}
        >
            <View style={styles.container}>

                <TouchableOpacity style={styles.iconButton} onPress={onAttachPress}>
                    <Icon name="add-circle-outline" size={28} color="#999" />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Ask RhynoAI"
                        placeholderTextColor="#777"
                        multiline
                        scrollEnabled={true}
                        onEndEditing={handleSend}
                        returnKeyType="send"
                    />

                    <TouchableOpacity style={styles.sendVoiceButton} onPress={message.trim() ? handleSend : onVoiceInputPress}>
                        {message.trim() ? (
                            <Icon name="arrow-up-circle" size={28} color="#20a0f0" />
                        ) : (
                            <Icon name="mic-outline" size={28} color="#999" />
                        )}
                    </TouchableOpacity>
                </View>


                <TouchableOpacity style={styles.iconButton} onPress={onGPTsPress}>
                    <MaterialCommunityIcons name="dots-circle" size={28} color="#999999" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        width: '100%',
        backgroundColor: '#000000', // 👈 کاملاً مشکی
        paddingBottom: Platform.OS === 'ios' ? 0 : 5, // 👈 تنظیم فاصله از پایین برای اندروید
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#333333',
        backgroundColor: '#000000', // 👈 کاملاً مشکی
    },
    iconButton: {
        paddingHorizontal: 5,
        paddingBottom: Platform.OS === 'ios' ? 8 : 5, // کمی تنظیم برای آیکون‌ها
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#202020', // رنگ خاکستری تیره برای پس‌زمینه Input
        borderRadius: 25, // گرد کردن لبه‌ها
        marginHorizontal: 8,
        paddingVertical: Platform.OS === 'ios' ? 8 : 0, // پدینگ برای iOS
    },
    textInput: {
        flex: 1,
        maxHeight: 120, // محدود کردن ارتفاع برای مولتی‌لاین
        minHeight: 35, // حداقل ارتفاع
        fontSize: 16,
        color: 'white',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 8 : 10, // تنظیم پدینگ برای تراز
        paddingBottom: Platform.OS === 'ios' ? 8 : 10,
        lineHeight: 22, // ارتفاع خط برای خوانایی
    },
    sendVoiceButton: {
        paddingRight: 10,
        paddingLeft: 5,
        paddingBottom: Platform.OS === 'ios' ? 0 : 5, // تنظیم برای آیکون میکروفون/ارسال
        justifyContent: 'center',
        alignItems: 'center',
    },
});