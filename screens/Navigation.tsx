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
import { BackHandler } from 'react-native';
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

export const useAndroidBackHandler = (navigation: any) => {
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                const state = navigation.getState();
                const route = state.routes[state.index];
                const currentRouteName = route.name;

                // --- ۱. مدیریت صفحه چت ---
                if (currentRouteName === 'Chat') {
                    // چک می‌کنیم آیا یک چت خاص باز است (chatId دارد)
                    const hasChatId = route.params?.chatId;

                    // ✅✅✅ اصلاحیه اینجاست ✅✅✅
                    if (hasChatId) {
                        // اگر چت باز بود، به هندلر اندروید بگو کاری انجام نده
                        // و اجازه بده خود React Navigation کار پیش‌فرض (pop) را انجام دهد
                        // تا به صفحه قبلی (ChatListScreen) برگردد.
                        return false;
                    }

                    // اگر صفحه اصلی چت بود (بدون chatId)، اجازه خروج بده
                    return false;
                }

                // --- ۲. مدیریت صفحه تنظیمات (که یک Stack است) ---
                if (currentRouteName === 'Settings') {
                    // استک داخلی تنظیمات را چک می‌کنیم
                    const settingsState = route.state;
                    // اگر در صفحه‌ای غیر از صفحه اول (index > 0) بودیم (مثلاً CustomPayment)
                    if (settingsState && settingsState.index > 0) {
                        // اجازه بده خود Stack تنظیمات "بک" را مدیریت کند
                        navigation.goBack();
                        return true; // جلوی خروج از اپ را بگیر
                    }
                    // اگر در صفحه اصلی تنظیمات (SettingsMain) بودیم، اجازه خروج بده
                    return false;
                }

                // --- ۳. مدیریت صفحه تاریخچه چت ---
                if (currentRouteName === 'ChatList') {
                    // این یک صفحه اصلی است، اجازه خروج بده
                    return false;
                }

                // پیش‌فرض: اجازه خروج بده
                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [navigation])
    );
};

export default function AppNavigation() {

    // ❌❌❌ این دو خط باید حذف شوند
    // const navigation = useNavigation();
    // useAndroidBackHandler(navigation);
    // هوک useAndroidBackHandler باید توسط کامپوننت‌های *داخل* Navigator استفاده شود، نه خود Navigator

    return (
        <Drawer.Navigator
            initialRouteName="Chat"
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                drawerStyle: { backgroundColor: '#111' },
                drawerLabelStyle: { color: '#fff' },
                drawerActiveTintColor: '#20a0f0',
                drawerInactiveTintColor: '#888',
            }}
        >
            <Drawer.Screen
                name="ChatList"
                component={ChatListScreen}
                options={{
                    title: 'تاریخچه چت‌ها',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => <Icon name="chatbubbles-outline" color={color} size={size} />,
                }}
            />

            {/* ✅✅✅ ۴. تغییر اصلی اینجاست ✅✅✅ */}
            <Drawer.Screen
                name="Settings"
                component={SettingsStackNavigator} // ⬅️ به جای SettingsScreen، از Stack استفاده می‌کنیم
                options={{
                    title: 'پنل کاربری',
                    headerShown: false, // هدر Drawer را خاموش می‌کنیم
                    drawerIcon: ({ color, size }) => <Icon name="person-circle-outline" color={color} size={size} />,
                }}
            />

            <Drawer.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
            />
        </Drawer.Navigator>
    );
}