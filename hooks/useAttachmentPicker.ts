import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// ❌ ایمپورت‌های Supabase و User از اینجا حذف شدند چون دیگر لازم نیستند
import { IMessage } from 'react-native-gifted-chat';
import Toast from 'react-native-toast-message';
import { DocumentPickerAsset } from 'expo-document-picker';

const YOUR_BACKEND_URL = 'https://www.rhynoai.ir';

interface UseAttachmentPickerProps {
    setStagedImage: React.Dispatch<React.SetStateAction<string | null>>;
    setStagedFile: (asset: DocumentPickerAsset | null) => void;
}

export const useAttachmentPicker = ({
    setStagedImage,
    setStagedFile
}: UseAttachmentPickerProps) => {

    // --- منطق انتخاب عکس (اصلاح شد) ---
    const handleImagePick = useCallback(async () => {
        // ❌ خط زیر حذف شد چون 'user' دیگر در این فایل وجود ندارد
        // if (!user) return; 

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('خطا', 'برای انتخاب عکس به اجازه دسترسی به گالری نیاز داریم.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
            base64: true,
        });
        if (result.canceled || !result.assets || !result.assets[0].base64) {
            return;
        }
        const asset = result.assets[0];
        const base64Uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
        setStagedImage(base64Uri);

    }, [setStagedImage]); // ❌ 'user' از وابستگی‌ها (dependency array) هم حذف شد


    // --- منطق انتخاب فایل (این درست است) ---
    const handleFilePick = useCallback(async () => {
        let docResult: DocumentPicker.DocumentPickerResult;
        try {
            docResult = await DocumentPicker.getDocumentAsync({
                type: [
                    "application/pdf",
                    "text/plain",
                    "text/markdown",
                    "application/json",
                    "text/csv"
                ],
            });
        } catch (e: any) {
            console.error("Error picking document:", e);
            Alert.alert("خطا", "خطا در انتخاب فایل: " + e.message);
            return;
        }

        if (docResult.canceled || !docResult.assets) {
            setStagedFile(null); // ✅ اطمینان از نال کردن در صورت لغو
            return;
        }

        setStagedFile(docResult.assets[0]);

    }, [setStagedFile]);


    // --- تابع اصلی که منو را نشان می‌دهد (بدون تغییر) ---
    const handleAttachPress = () => {
        Alert.alert(
            "ارسال فایل",
            "چه فایلی می‌خواهید ارسال کنید؟",
            [
                { text: "📸 ضمیمه عکس (برای چت)", onPress: handleImagePick },
                { text: "📄 ضمیمه فایل (برای پردازش)", onPress: handleFilePick }, // ✅ متن اصلاح شد
                {
                    text: "🎙️ ضبط صدا (به زودی)",
                    onPress: () => Alert.alert("به زودی", "این قابلیت در حال ساخت است.")
                },
                { text: "لغو", style: "cancel" }
            ]
        );
    };

    return { handleAttachPress };
};
