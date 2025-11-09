import { Alert } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';
import React, { useState, useEffect } from 'react';
// ۱. تعریف ورودی‌های مورد نیاز هوک
interface UseChatActionsProps {
    messages: IMessage[];
    setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
    handleSendMessage: (text: string) => void;
    setEditText: (text: string) => void;
    // ما به اینها هم نیاز داریم تا بتوانیم پیوست‌ها را پاک کنیم
    setStagedImage: (image: string | null) => void;
    setStagedFileState: (file: any) => void; // 'any' برای سادگی
}
interface Message {
    _id: string;
    text: string;
    sender: 'user' | 'model'; // یا هر چیزی که استفاده می‌کنید
    // ... هر فیلد دیگری که پیام شما دارد
}
export function useChatActions({
    messages,
    setMessages,
    handleSendMessage,
    setEditText,
    setStagedImage,
    setStagedFileState
}: UseChatActionsProps) {

    /**
     * منطق ویرایش پیام کاربر
     * (پیام را برای ویرایش در اینپوت باکس قرار می‌دهد)
     */
    const handleEditMessage = (msg: IMessage) => {
        let textContent = msg.text;

        // اگر پیام حاوی عکس بود، فقط متن را استخراج کن
        const SEPARATOR = '%RHINO_IMAGE_SEPARATOR%';
        if (msg.text && msg.text.includes(SEPARATOR)) {
            const parts = msg.text.split(SEPARATOR);
            textContent = parts[0]?.replace(/%$/, '').trim();
        } else if (!msg.text && msg.image) {
            textContent = ''; // کاربر فقط عکس فرستاده بود
        }

        // ۱. متن را به state ویرایش پاس بده (تا ChatInput آن را بگیرد)
        setEditText(textContent);

        // ۲. هرگونه فایل یا عکس در حال آپلود را پاک کن
        setStagedImage(null);
        setStagedFileState(null);

        // ۳. (اختیاری) به کاربر اطلاع بده
        // Toast.show({ type: 'info', text1: 'پیام برای ویرایش آماده شد' });
    };

    /**
     * منطق تلاش مجدد برای پاسخ بات
     * (پاسخ قبلی بات را حذف و پرامپت کاربر را دوباره ارسال می‌کند)
     */
    const handleRegenerate = (botMessageIndex: number) => {
        // چون لیست inverted است، پیام کاربر، پیام *بعدی* در آرایه است
        const userPromptIndex = botMessageIndex + 1;

        // چک کردن اینکه آیا پیام کاربر اصلا وجود دارد
        if (userPromptIndex >= messages.length) {
            Alert.alert("خطا", "پیام کاربر قبلی برای این پاسخ یافت نشد.");
            return;
        }

        const botMessage = messages[botMessageIndex];
        const userPromptMessage = messages[userPromptIndex];

        // اعتبارسنجی نهایی
        if (!userPromptMessage || userPromptMessage.user._id !== 1) {
            Alert.alert("خطا", "پیام کاربر قبلی معتبر نیست. (ID: " + userPromptMessage?.user?._id + ")");
            return;
        }

        console.log(`Regenerating for prompt: "${userPromptMessage.text}"`);

        // ۱. پاسخ قبلی (و ناموفق) بات را از لیست پیام‌ها حذف کن
        setMessages(prev => prev.filter(m => m._id !== botMessage._id));

        // ۲. پرامپت اصلی کاربر را دوباره به handleSendMessage بفرست
        // TODO: در آینده این بخش باید پیوست‌های (ضمیمه) قبلی را هم مدیریت کند

        let textContent = userPromptMessage.text;
        const SEPARATOR = '%RHINO_IMAGE_SEPARATOR%';
        if (userPromptMessage.text && userPromptMessage.text.includes(SEPARATOR)) {
            const parts = userPromptMessage.text.split(SEPARATOR);
            textContent = parts[0]?.replace(/%$/, '').trim();
        }

        // (فعلا فقط متن را دوباره ارسال می‌کنیم)
        handleSendMessage(textContent);
    };

    // برگرداندن توابع برای استفاده در ChatScreen
    return { handleEditMessage, handleRegenerate };
}