// Navigation.tsx
import 'react-native-gesture-handler';
import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import ChatScreen from './ChatScreen'; // مسیر درست فایل‌ها رو چک کنید
import SettingsScreen from './SettingsScreen'; // فرض می‌کنیم این رو هم در screens دارید
import ChatListScreen from './ChatListScreen'; // ✅ ایمپورت جدید
import { Text, View } from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { NavigatorScreenParams } from '@react-navigation/native'
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import Icon from 'react-native-vector-icons/Ionicons';

export type DrawerNavigationType = DrawerNavigationProp<DrawerParamList>;
// ... (SettingsScreen مثل قبل، اگر جدا نکرده‌اید) ...
export type DrawerParamList = {
    ChatList: undefined; // صفحه لیست چت پارامتری نمی‌گیرد
    Chat: { chatId?: string }; // صفحه چت می‌تواند chatId بگیرد (اختیاری فعلا)
    Settings: undefined; // صفحه تنظیمات پارامتری نمی‌گیرد
};
const Drawer = createDrawerNavigator<DrawerParamList>();
export default function AppNavigation() {
    return (
        <Drawer.Navigator
            initialRouteName="Chat"
            // 👇 ۲. استفاده از کامپوننت سفارشی به عنوان محتوای منو
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            // (اختیاری) استایل‌های کلی منو
            screenOptions={{
                drawerStyle: { backgroundColor: '#111' },
                drawerLabelStyle: { color: '#fff' },
                drawerActiveTintColor: '#20a0f0', // رنگ آیتم فعال
                drawerInactiveTintColor: '#888',  // رنگ آیتم غیرفعال
            }}
        >
            {/* این آیتم توسط DrawerItemList رندر می‌شود */}
            <Drawer.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{
                    title: 'تاریخچه چت‌ها',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => <Icon name="chatbubbles-outline" color={color} size={size} />
                }}
            />

            {/* این آیتم هم توسط DrawerItemList رندر می‌شود */}
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'پنل کاربری',
                    headerShown: true, // این صفحه می‌تواند هدر خودش را داشته باشد
                    drawerIcon: ({ color, size }) => <Icon name="person-circle-outline" color={color} size={size} />
                }}
            />

            {/* صفحه چت اصلی (از منو مخفی می‌شود چون دکمه "چت جدید" را داریم) */}
            <Drawer.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' } // 👈 مخفی کردن از لیست خودکار
                }}
            />
        </Drawer.Navigator>
    );
}