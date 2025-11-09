// src/components/WelcomePrompts.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LLMID } from '../types/llms';
// تعریف نوع داده برای هر پیشنهاد
type PromptSuggestion = {
    id: string;
    icon: string; // نام آیکون از Ionicons
    title: string;
    text: string; // متنی که واقعاً ارسال می‌شود
    modelId?: LLMID
};

// لیست پیشنهادات شما (اینها را می‌توانید به دلخواه تغییر دهید)
const SUGGESTIONS: PromptSuggestion[] = [
    {
        id: '1',
        icon: 'image-outline',
        title: 'یک لوگو برای کافه بساز',
        text: 'یک لوگوی مینیمال برای یک کافه به سبک مدرن طراحی کن',
        modelId: "google/gemini-2.5-flash-image"

    },
    {
        id: '2',
        icon: 'bulb-outline',
        title: 'ایده برای پست وبلاگ',
        text: '۵ ایده برای پست وبلاگ در مورد آینده هوش مصنوعی به من بده',
        modelId: "gpt-4o-mini"
    },
    {
        id: '3',
        icon: 'code-slash-outline',
        title: 'یک تابع پایتون بنویس',
        text: 'یک تابع پایتون بنویس که ایمیل را اعتبارسنجی کند',
        modelId: "gpt-4o-mini"
    },
    {
        id: '4',
        icon: 'earth-outline',
        title: 'Rhyno AI چیست؟',
        text: 'تو کی هستی و چه کارهایی می‌توانی انجام دهی؟',
        modelId: "gpt-4o-mini"
    },
];

// تعریف Props: این کامپوننت یک تابع به عنوان ورودی می‌گیرد
type WelcomePromptsProps = {
    onPromptClick: (text: string, modelId?: LLMID | string) => void; // ✅✅✅
};

const WelcomePrompts = ({ onPromptClick }: WelcomePromptsProps) => {

    // تابع رندر کردن هر آیتم در لیست
    const renderItem = ({ item }: { item: PromptSuggestion }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPromptClick(item.text, item.modelId)}
        >
            <Icon name={item.icon} size={24} color="#C0C0C0" style={styles.icon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={SUGGESTIONS}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2} // نمایش در دو ستون
                columnWrapperStyle={styles.row}
                scrollEnabled={false} // چون داخل صفحه اصلی است
            />
        </View>
    );
};

// استایل‌های کامپوننت
const FONT_REGULAR = 'Vazirmatn-Medium';
const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 30, // فاصله از متن خوشامدگویی
    },
    row: {
        justifyContent: 'space-between', // ایجاد فاصله بین دو ستون
    },
    card: {
        backgroundColor: '#1C1C1E', // یک خاکستری بسیار تیره
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        // عرض هر کارت (نصف عرض صفحه با کمی فاصله)
        width: '48%',
    },
    icon: {
        marginBottom: 10,
    },
    cardTitle: {
        color: '#EAEAEA',
        fontSize: 15,
        fontFamily: FONT_REGULAR,
        lineHeight: 22,
    },
});

export default WelcomePrompts;