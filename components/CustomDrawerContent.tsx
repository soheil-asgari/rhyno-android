// components/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList, // 👈 برای نمایش آیتم‌های موجود (تاریخچه و پنل)
    DrawerItem,     // 👈 برای آیتم سفارشی "چت جدید"
} from '@react-navigation/drawer';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationType } from '../screens/Navigation';
import { supabase } from '../lib/supabase';

export function CustomDrawerContent(props: any) {
    // ‼️ موقتی: این State باید سراسری شود (مثلاً با Context)
    const {
        selectedModel,
        setSelectedModel,
        availableModels,
        isLoadingModels,
        setCurrentChatId,
        user // 👈 برای دکمه "چت جدید"
    } = useChat();

    const navigation = useNavigation<DrawerNavigationType>();
    const handleNewChat = () => {
        props.navigation.closeDrawer();
        setCurrentChatId(undefined);
        navigation.navigate('Chat', { chatId: undefined });
        props.navigation.closeDrawer();

    };
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("خطا در خروج");
        } else {
            // آپشنال: کاربر را به صفحه لاگین هدایت کنید اگر دارید
            // navigation.navigate('Login'); 
            props.navigation.closeDrawer(); // بستن منو
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
                    {/* 👇 ۳. نمایش لودینگ یا Picker */}
                    {isLoadingModels ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <RNPickerSelect
                            value={selectedModel}
                            onValueChange={(value) => value && setSelectedModel(value)} // 👈 آپدیت Context
                            items={availableModels}
                            placeholder={{}}
                            style={pickerSelectStyles}
                        // ... (بقیه props) ...
                        />
                    )}
                </View>

                {/* ۳. تاریخچه چت و پنل کاربری */}
                {/* DrawerItemList به طور خودکار "ChatList" و "Settings" را رندر می‌کند */}
                <DrawerItemList {...props} />
                <View style={styles.separator} />
                <DrawerItem
                    label="خروج"
                    labelStyle={styles.logoutLabel} // استایل متفاوت برای خروج
                    icon={({ color, size }) => (
                        <Icon name="log-out-outline" color={'#FF3B30'} size={size} /> // قرمز
                    )}
                    onPress={handleLogout}
                />
            </View>
        </DrawerContentScrollView>
    );
}

// استایل‌های منوی سفارشی
const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        paddingTop: 10,
    },
    drawerLabel: {
        color: '#fff',
        fontWeight: '600',
    },
    modelSelectorContainer: {
        paddingHorizontal: 15,
        marginVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#333',
        paddingVertical: 15,
    },
    modelLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 10,
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 15, // فاصله
    },
    logoutLabel: {
        color: '#FF3B30', // قرمز
        fontWeight: '600',
    },
});

// استایل‌های Picker
const pickerSelectStyles = StyleSheet.create({
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