import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentPickerAsset } from 'expo-document-picker';
// 💡 این کتابخانه را برای نمایش منوی زیبا اضافه می‌کنیم
import { useActionSheet } from '@expo/react-native-action-sheet';

// رابط (Interface) را کمی تغییر می‌دهیم تا خواناتر باشد
interface UseAttachmentPickerProps {
    // به جای SetState، توابع callback تمیزتری داریم
    onImageSelect: (uri: string | null) => void;
    onFileSelect: (asset: DocumentPickerAsset | null) => void;
}

export const useAttachmentPicker = ({
    onImageSelect,
    onFileSelect
}: UseAttachmentPickerProps) => {

    // 💡 هوک اصلی برای نمایش ActionSheet
    const { showActionSheetWithOptions } = useActionSheet();

    // --- 1. منطق انتخاب عکس (بهینه‌شده با URI) ---
    const handleImagePick = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('خطا', 'برای انتخاب عکس به اجازه دسترسی به گالری نیاز داریم.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            // ✅ استفاده از سینتکس مدرن
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
            // ❌ دیگر نیازی به Base64 نداریم (بهبود عملکرد)
            // base64: false, 
        });

        if (result.canceled || !result.assets) {
            // onImageSelect(null); // اگر بخواهیم در صورت لغو، قبلی را پاک کنیم
            return;
        }

        const asset = result.assets[0];

        // ✅ پاک کردن فایل، در صورت وجود، قبل از تنظیم عکس جدید
        onFileSelect(null);
        // ✅ ارسال URI به جای رشته‌ی سنگین Base64
        onImageSelect(asset.uri);

    }, [onImageSelect, onFileSelect]);


    // --- 2. منطق انتخاب فایل (بهبود یافته) ---
    const handleFilePick = useCallback(async () => {
        let docResult: DocumentPicker.DocumentPickerResult;
        try {
            docResult = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/pdf",
                    "text/plain",
                    "text/markdown",
                    "application/json",
                    "text/csv",
                    // می‌توانید موارد بیشتری مثل فایل‌های آفیس اضافه کنید
                    "application/msword", // .doc
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
                    "application/vnd.ms-excel", // .xls
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
                ],
            });
        } catch (e: any) {
            console.error("Error picking document:", e);
            Alert.alert("خطا", "خطا در انتخاب فایل: " + e.message);
            return;
        }

        if (docResult.canceled || !docResult.assets) {
            // onFileSelect(null); // اگر بخواهیم در صورت لغو، قبلی را پاک کنیم
            return;
        }

        // ✅ پاک کردن عکس، در صورت وجود، قبل از تنظیم فایل جدید
        onImageSelect(null);
        onFileSelect(docResult.assets[0]);

    }, [onFileSelect, onImageSelect]);


    // --- 3. تابع اصلی (بازنویسی شده با ActionSheet) ---
    const handleAttachPress = () => {
        // گزینه‌های منو
        const options = [
            '📸 ضمیمه عکس',
            '📄 ضمیمه فایل',
            '🎙️ ضبط صدا (به زودی)',
            'لغو' // دکمه لغو
        ];
        const destructiveButtonIndex = undefined;
        const cancelButtonIndex = 3; // ایندکس دکمه "لغو"

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: "ارسال فایل",
                message: "چه فایلی می‌خواهید ارسال کنید؟",

                // ✅ استایل‌دهی برای وسط چین کردن و بهبود ظاهر
                textStyle: {
                    textAlign: 'center', // وسط چین کردن متن هر گزینه
                    // fontWeight: 'bold', // اگر می‌خواهید متن‌ها پررنگ باشند
                },
                titleTextStyle: {
                    textAlign: 'center', // وسط چین کردن عنوان
                    fontWeight: 'bold',
                    fontSize: 18,
                },
                messageTextStyle: {
                    textAlign: 'center', // وسط چین کردن پیام
                    fontSize: 14,
                    color: '#666', // رنگ خاکستری برای متن توضیحات
                },
                containerStyle: {
                    // این برای استایل کلی ActionSheet است
                    // مثلاً می‌توانید borderRadius اضافه کنید
                    borderRadius: 15,
                    overflow: 'hidden', // مهم برای borderRadius
                },
            },
            (selectedIndex?: number) => {
                // بررسی دکمه‌ای که کاربر انتخاب کرده
                switch (selectedIndex) {
                    case 0:
                        // ضمیمه عکس
                        handleImagePick();
                        break;
                    case 1:
                        // ضمیمه فایل
                        handleFilePick();
                        break;
                    case 2:
                        // ضبط صدا
                        Alert.alert("به زودی", "این قابلیت در حال ساخت است.");
                        break;

                    case cancelButtonIndex:
                    // لغو (کاری انجام نمی‌دهد)
                    default:
                        break;
                }
            }
        );
    };

    return { handleAttachPress };
};