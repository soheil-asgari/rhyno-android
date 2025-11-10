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


    userMessageRow: { // چینش راست
        justifyContent: 'flex-end',
    },
    botMessageRow: { // چینش چپ
        justifyContent: 'flex-end', // ✅ اصلاح شد: قبلاً flex-end بود
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
    userFileBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // شفاف روی گرادیانت
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    botFileBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // شفاف روی خاکستری
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    fileInMessageText: {
        color: '#EAEAEA',
        fontSize: 15,
        flexShrink: 1,
        fontFamily: FONT_REGULAR,
    },
    messageRow: {
        flexDirection: 'row',
        marginVertical: 2, // ✅ کاهش فاصله عمودی
    },


    // ✅✅✅ بازطراحی کامل دکمه‌های اکشن ✅✅✅
    actionButtonContainer: {
        flexDirection: 'row',
        marginTop: 4, // ✅ فاصله کمتر
        marginHorizontal: 12,
        marginBottom: 8, // ✅ اضافه شدن فاصله پایینی
    },
    actionButton: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 16, // کپسولی
        marginHorizontal: 3,
        backgroundColor: '#2C2C2E', // ✅ پس‌زمینه کپسولی
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3C3C3E', // ✅ یک حاشیه ظریف
    },
    actionButtonText: {
        color: '#E0E0E0',
        fontSize: 12,
        fontFamily: FONT_REGULAR,
        marginLeft: 4,
    },
    // ✅✅✅ پایان بازطراحی ✅✅✅

    messageBubbleBase: {
        padding: 12,
        maxWidth: '95%',
        marginHorizontal: 5,
        borderRadius: BUBBLE_RADIUS,
    },
    userMessage: {
        backgroundColor: 'transparent', // ✅ رنگ توسط گرادیانت تامین می‌شود
    },
    botMessage: {
        backgroundColor: '#000000ff', // ✅ کمی روشن‌تر شد
    },
});