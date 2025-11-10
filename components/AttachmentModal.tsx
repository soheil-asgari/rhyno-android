import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Modal from 'react-native-modal'; // کتابخانه مودال

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onSelectOption: (type: 'image' | 'file' | 'voice' | 'cancel') => void;
}

const options = [
    { key: 'image', text: 'ضمیمه عکس', icon: '📸' },
    { key: 'file', text: 'ضمیمه فایل', icon: '📄' },
    { key: 'voice', text: 'ضبط صدا (به زودی)', icon: '🎙️' },
];

export const AttachmentModal: React.FC<Props> = ({ isVisible, onClose, onSelectOption }) => {
    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={onClose} // وقتی بیرون مودال کلیک شد
            onBackButtonPress={onClose} // وقتی دکمه بک اندروید زده شد
            style={styles.modal} // استایل اصلی مودال (در پایین صفحه)
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropTransitionOutTiming={0} // برای بسته شدن سریع
            hideModalContentWhileAnimating={true}
        >
            <View style={styles.container}>
                {/* بخش عنوان */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>ارسال فایل</Text>
                    <Text style={styles.message}>چه فایلی می‌خواهید ارسال کنید؟</Text>
                </View>

                {/* بخش گزینه‌ها */}
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.key}
                        style={styles.optionButton}
                        onPress={() => onSelectOption(opt.key as any)}
                    >
                        {/* متن در سمت راست */}
                        <Text style={styles.optionText}>{opt.text}</Text>
                        {/* آیکون در سمت چپ */}
                        <Text style={styles.optionIcon}>{opt.icon}</Text>
                    </TouchableOpacity>
                ))}

                {/* بخش لغو */}
                <TouchableOpacity
                    style={[styles.optionButton, styles.cancelButton]}
                    onPress={onClose} // فقط مودال را می‌بندد
                >
                    <Text style={[styles.optionText, styles.cancelText]}>لغو</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end', // چسبیده به پایین
        margin: 0, // بدون حاشیه
    },
    container: {
        backgroundColor: '#1E1E1E', // رنگ تیره (با تم شما هماهنگ شود)
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopLeftRadius: 20, // گوشه‌های گرد
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20, // برای Home Indicator در iOS
    },
    titleContainer: {
        alignItems: 'center', // وسط چین کردن
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    message: {
        fontSize: 14,
        color: '#9E9E9E', // خاکستری
        marginTop: 4,
    },
    optionButton: {
        flexDirection: 'row', // متن و آیکون در یک ردیف
        justifyContent: 'space-between', // متن و آیکون در دو طرف
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#333333', // جداکننده
    },
    optionText: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'right', // متن‌ها راست‌چین
    },
    optionIcon: {
        fontSize: 20,
    },
    cancelButton: {
        borderBottomWidth: 0, // دکمه آخر جداکننده ندارد
        justifyContent: 'center', // وسط چین کردن متن لغو
        paddingTop: 16,
    },
    cancelText: {
        color: '#007AFF', // رنگ آبی استاندارد (یا رنگ دلخواه)
        fontWeight: 'bold',
        textAlign: 'center',
    },
});