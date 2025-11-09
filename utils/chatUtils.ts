// src/utils/chatUtils.ts
import { IMessage } from 'react-native-gifted-chat';

/**
 * بررسی می‌کند که آیا متن فارسی/عربی (راست‌چین) است یا نه.
 */
export const isRTL = (text: string): boolean => {
    if (!text || text.length === 0) return true; // پیش‌فرض فارسی (راست‌چین)
    const rtlRegex = /[\u0600-\u06FF]/;
    const testSnippet = text.substring(0, 20);
    return rtlRegex.test(testSnippet);
};

/**
 * یک آبجکت پیام استاندارد برای ربات می‌سازد (برای "در حال تایپ").
 */
export const createBotMessage = (id: string | number, text: string): IMessage & { isTyping?: boolean } => ({
    _id: id,
    text,
    createdAt: new Date(),
    user: { _id: 2, name: 'Rhyno AI' },
    isTyping: true,
});

/**
 * تاریخ را به یک تایم‌اسپ عددی تبدیل می‌کند.
 */
export const getTimestamp = (dateOrNumber: Date | number | undefined): number => {
    if (dateOrNumber instanceof Date) return dateOrNumber.getTime();
    if (typeof dateOrNumber === 'number') return dateOrNumber;
    return 0;
};