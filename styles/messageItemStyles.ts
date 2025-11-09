// src/styles/messageItemStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const FONT_REGULAR = 'Vazirmatn-Medium';
const BUBBLE_RADIUS = 18;
const STICKY_RADIUS = 5;
const windowWidth = Dimensions.get('window').width;

export const messageItemStyles = StyleSheet.create({
    imageInMessage: {
        width: windowWidth * 0.7, // 70% عرض حباب
        height: windowWidth * 0.7, // مربع
        borderRadius: 10,
        marginTop: 8,
        backgroundColor: '#8E8E93', // رنگ موقت تا زمان لود شدن عکس
    },
    fileInMessageBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    fileInMessageText: {
        color: '#EAEAEA',
        fontSize: 15,
        flexShrink: 1,
        fontFamily: FONT_REGULAR,
    },
    messageRow: { // کانتینر ردیف
        flexDirection: 'row',
        marginVertical: 5,
    },
    userMessageRow: { // چینش راست
        justifyContent: 'flex-end',
    },
    botMessageRow: { // چینش چپ
        justifyContent: 'flex-end', // ✅ اصلاح شد: قبلاً flex-end بود
    },
    actionButtonContainer: {
        flexDirection: 'row',
        marginTop: 6, // فاصله از حباب
        marginHorizontal: 12, // همراستا با حباب
    },
    actionButton: {
        paddingVertical: 3,
        paddingHorizontal: 7,
        borderRadius: 16,
        marginHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageBubbleBase: {
        padding: 12,
        maxWidth: '95%',
        marginHorizontal: 5, // کمی فاصله از لبه
        borderRadius: BUBBLE_RADIUS,
    },
    userMessage: {
        backgroundColor: '#2C2C2E',
    },
    botMessage: {
        backgroundColor: '#000000ff', // ✅ رنگ ربات کمی متفاوت شد
    },
    // کاربر - انگلیسی (می‌چسبد به راست)
    userBubbleLTR: {
        borderBottomLeftRadius: BUBBLE_RADIUS,
        borderTopLeftRadius: BUBBLE_RADIUS,
        borderBottomRightRadius: BUBBLE_RADIUS,
        borderTopRightRadius: STICKY_RADIUS, // <- تیز
    },
    // کاربر - فارسی (می‌چسبد به راست)
    userBubbleRTL: {
        borderBottomLeftRadius: BUBBLE_RADIUS,
        borderTopLeftRadius: STICKY_RADIUS, // <- تیز
        borderBottomRightRadius: BUBBLE_RADIUS,
        borderTopRightRadius: BUBBLE_RADIUS,
    },
    // ربات - انگلیسی (می‌چسبد به چپ)
    botBubbleLTR: {
        borderBottomLeftRadius: STICKY_RADIUS, // <- تیز
        borderTopLeftRadius: BUBBLE_RADIUS,
        borderBottomRightRadius: BUBBLE_RADIUS,
        borderTopRightRadius: BUBBLE_RADIUS,
    },
    // ربات - فارسی (می‌چسبد به چپ)
    botBubbleRTL: {
        borderBottomLeftRadius: BUBBLE_RADIUS,
        borderTopLeftRadius: BUBBLE_RADIUS,
        borderBottomRightRadius: STICKY_RADIUS, // <- تیز
        borderTopRightRadius: BUBBLE_RADIUS,
    },
});