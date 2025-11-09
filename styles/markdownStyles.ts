// src/styles/markdownStyles.ts
import { StyleSheet, Platform } from 'react-native';

// فونت‌ها را مطابق با پروژه خود تنظیم کنید
const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';
const CODE_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

// رنگ‌های اصلی (برای استفاده مجدد)
const USER_TEXT_COLOR = '#FFFFFF';
const BOT_TEXT_COLOR = '#EAEAEA';
const BOT_LINK_COLOR = '#0A84FF'; // (آبی اپل)
const CODE_BG_COLOR = 'rgba(255, 255, 255, 0.1)';

export const markdownStyles = (isRTL: boolean, isUser: boolean) => {
    const TEXT_COLOR = isUser ? USER_TEXT_COLOR : BOT_TEXT_COLOR;

    return StyleSheet.create({
        // --- استایل‌های اصلی (از قبل موجود) ---
        body: {
            color: TEXT_COLOR,
            fontSize: 16,
            lineHeight: 25,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
            fontFamily: FONT_REGULAR,
        },
        link: {
            color: isUser ? USER_TEXT_COLOR : BOT_LINK_COLOR,
            textDecorationLine: 'underline',
            fontWeight: 'bold',
            fontFamily: FONT_REGULAR,
        },
        code_inline: {
            backgroundColor: CODE_BG_COLOR,
            color: TEXT_COLOR,
            paddingVertical: 2,
            paddingHorizontal: 4,
            borderRadius: 4,
            fontFamily: CODE_FONT,
        },
        fence: {
            // (این استایل توسط CopyableCodeBlock استفاده می‌شه)
            backgroundColor: 'transparent',
            color: BOT_TEXT_COLOR,
            fontFamily: CODE_FONT,
        },
        code_block: {
            // (این استایل توسط CopyableCodeBlock استفاده می‌شه)
            backgroundColor: 'transparent',
            color: BOT_TEXT_COLOR,
            fontFamily: CODE_FONT,
        },

        // ✅✅✅ --- استایل‌های جدید --- ✅✅✅

        // --- عناوین (Headings) ---
        heading1: {
            fontFamily: FONT_BOLD,
            fontSize: 24,
            color: TEXT_COLOR,
            marginTop: 10,
            marginBottom: 5,
            writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        heading2: {
            fontFamily: FONT_BOLD,
            fontSize: 20,
            color: TEXT_COLOR,
            marginTop: 8,
            marginBottom: 4,
            writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        heading3: {
            fontFamily: FONT_BOLD,
            fontSize: 18,
            color: TEXT_COLOR,
            marginTop: 6,
            marginBottom: 3,
            writingDirection: isRTL ? 'rtl' : 'ltr',
        },

        // --- نقل قول (Blockquote) ---
        blockquote: {
            backgroundColor: CODE_BG_COLOR, // (پس‌زمینه مشابه کد)
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginVertical: 5,
            borderLeftWidth: 4,
            borderLeftColor: '#8E8E93', // (یک مرز خاکستری)
            borderRadius: 4,
        },

        // --- لیست‌ها (Bullets & Numbers) ---
        bullet_list: {
            marginVertical: 5,
        },
        ordered_list: {
            marginVertical: 5,
        },
        list_item: {
            flexDirection: isRTL ? 'row-reverse' : 'row', // (پشتیبانی از RTL)
            alignItems: 'flex-start',
            marginVertical: 4,
        },
        // (استایل متن داخل لیست‌ها از 'body' ارث‌بری می‌کنه)

        // --- جدول (Table) ---
        table: {
            borderWidth: 1,
            borderColor: '#8E8E93',
            borderRadius: 4,
            marginVertical: 10,
            // (برای پشتیبانی از RTL در جدول، کتابخانه ممکن است محدودیت داشته باشد)
        },
        th: { // (هدر جدول)
            backgroundColor: CODE_BG_COLOR,
            padding: 8,
            borderWidth: 1,
            borderColor: '#8E8E93',
            fontFamily: FONT_BOLD,
            color: TEXT_COLOR,
            textAlign: isRTL ? 'right' : 'left',
        },
        td: { // (سلول جدول)
            padding: 8,
            borderWidth: 1,
            borderColor: '#8E8E93',
            fontFamily: FONT_REGULAR,
            color: TEXT_COLOR,
            textAlign: isRTL ? 'right' : 'left',
        },

        // --- متفرقه ---
        hr: { // (خط افقی)
            backgroundColor: '#8E8E93',
            height: 1,
            marginVertical: 10,
        },
        strong: { // (متن **بولد**)
            fontFamily: FONT_BOLD,
        },
        em: { // (متن *ایتالیک*)
            fontFamily: FONT_REGULAR,
            fontStyle: 'italic',
        },
    });
};