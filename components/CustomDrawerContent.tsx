// components/CustomDrawerContent.tsx
import React, { useState } from 'react'; // ✅ [اصلاح] useState برای دکمه خروج اضافه شد
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationType } from '../screens/Navigation';
import { supabase } from '../lib/supabase';

export function CustomDrawerContent(props: any) {
    const {
        selectedModel,
        setSelectedModel,
        availableModels,
        isLoadingModels,
        setCurrentChatId,
    } = useChat();

    const navigation = useNavigation<DrawerNavigationType>();

    // استیت لودینگ برای دکمه خروج
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleNewChat = () => {
        setCurrentChatId(undefined);
        // ✅ [اصلاح] اطمینان از ارسال پارامترهای صحیح
        navigation.navigate('Chat', { chatId: undefined });
        props.navigation.closeDrawer();
    };

    // ✅✅✅ [اصلاح خطای ۱] حل مشکل سایدبار
    const handleModelChange = (value: string | null) => {
        if (!value) return;

        // ۱. مدل را تنظیم کن
        setSelectedModel(value);

        // ۲. به صفحه چت برو
        // ✅ [اصلاح] ارسال پارامترهای صحیح (مانند handleNewChat)
        navigation.navigate('Chat', { chatId: undefined });

        // ۳. سایدبار را ببند
        props.navigation.closeDrawer();
    };

    // [اصلاح خطای ۲] حل مشکل دوبار کلیک خروج
    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("خطا در خروج");
            setIsLoggingOut(false);
        } else {
            props.navigation.closeDrawer();
            // (نیازی به false کردن نیست چون کامپوننت unmount می‌شود)
        }
    };

    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#111' }}>
            <View style={styles.drawerContainer}>
                {/* ۱. چت جدید */}
                <DrawerItem
                    label="چت جدید"
                    labelStyle={styles.drawerLabel}
                    icon={({ color, size }) => (
                        <Icon name="add-outline" color={'#fff'} size={size} />
                    )}
                    onPress={handleNewChat}
                />

                {/* ۲. انتخاب مدل */}
                <View style={styles.modelSelectorContainer}>
                    <Text style={styles.modelLabel}>انتخاب مدل</Text>
                    {isLoadingModels ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <RNPickerSelect
                            value={selectedModel}
                            onValueChange={handleModelChange}
                            items={availableModels}
                            placeholder={{}}
                            style={pickerSelectStyles}
                        />
                    )}
                </View>

                {/* ۳. تاریخچه چت و پنل کاربری */}
                <DrawerItemList {...props} />
                <View style={styles.separator} />
                <DrawerItem
                    // ✅✅✅ [اصلاح خطای ۲] استایل دکمه خروج
                    label="خروج"
                    labelStyle={[
                        styles.logoutLabel,
                        isLoggingOut && { color: '#888' } // استایل خاکستری هنگام لودینگ
                    ]}
                    icon={({ color, size }) => (
                        <Icon
                            name="log-out-outline"
                            color={isLoggingOut ? '#888' : '#FF3B30'} // آیکون خاکستری هنگام لودینگ
                            size={size}
                        />
                    )}
                    onPress={handleLogout}
                // ✅ [اصلاح] پراپرتی 'disabled' حذف شد چون وجود ندارد
                />
            </View>
        </DrawerContentScrollView>
    );
}
const FONT_REGULAR = 'Vazirmatn-Medium';
// ... (استایل‌ها بدون تغییر باقی می‌مانند)
const styles = StyleSheet.create({
    // ... (کد شما)
    drawerContainer: {
        flex: 1,
        paddingTop: 10,
        
    },
    drawerLabel: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: FONT_REGULAR,
    },
    modelSelectorContainer: {
        paddingHorizontal: 15,
        marginVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#333',
        paddingVertical: 15,
        fontFamily: FONT_REGULAR,
    },
    modelLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 10,
        fontFamily: FONT_REGULAR,
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 15, // فاصله
    },
    logoutLabel: {
        color: '#FF3B30', // قرمز
        fontWeight: '600',
        fontFamily: FONT_REGULAR,
    },
});

const pickerSelectStyles = StyleSheet.create({
    // ... (کد شما)
    inputIOS: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        paddingRight: 20,
        
    },
    inputAndroid: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        paddingRight: 20,
    },
});