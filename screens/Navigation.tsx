// Navigation.tsx
import 'react-native-gesture-handler';
import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // ✅ ۱. ایمپورت Stack Navigator
import ChatScreen from './ChatScreen';
import SettingsScreen from './SettingsScreen';
import ChatListScreen from './ChatListScreen';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import Icon from 'react-native-vector-icons/Ionicons';

import CustomPaymentScreen from '../components/CustomPaymentScreen'; // ✅ ۲. اصلاح مسیر (فرض بر اینکه کنار بقیه اسکرین‌ها است)
import type { SettingsStackParamList, DrawerParamList } from '../types/navigation.types';
// --- تعریف پارامترهای Stack تنظیمات ---


const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<SettingsStackParamList>();

// ✅ ۳. ساخت Stack Navigator برای تنظیمات
// این کامپوننت، پشته‌ی "تنظیمات" و "پرداخت" را مدیریت می‌کند
const SettingsStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false, // ما هدر را نمی‌خواهیم چون SettingsScreen هدر خودش را دارد
            }}
        >
            <Stack.Screen name="SettingsMain" component={SettingsScreen} />
            <Stack.Screen name="CustomPayment" component={CustomPaymentScreen} />
        </Stack.Navigator>
    );
};


const FONT_REGULAR = 'Vazirmatn-Medium';
export default function AppNavigation() {
    return (
        <Drawer.Navigator
            initialRouteName="Chat" // ✅ این درست است
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                drawerStyle: { backgroundColor: '#111' },
                drawerLabelStyle: { color: '#fff', fontFamily: FONT_REGULAR, },
                drawerActiveTintColor: '#20a0f0',
                drawerInactiveTintColor: '#888',
            }}
        >
            {/* ✅✅✅ تغییر اصلی اینجاست ✅✅✅ */}
            {/* اسکرین Chat (صفحه اصلی) را به عنوان اولین آیتم تعریف می‌کنیم */}
            <Drawer.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }, // همچنان در منو مخفی است
                }}
            />

            <Drawer.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{
                    title: 'تاریخچه چت‌ها',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => <Icon name="chatbubbles-outline" color={color} size={size} />,
                }}
            />

            <Drawer.Screen
                name="Settings"
                component={SettingsStackNavigator}
                options={{
                    title: 'پنل کاربری',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => <Icon name="person-circle-outline" color={color} size={size} />,
                }}
            />
        </Drawer.Navigator>
    );
}