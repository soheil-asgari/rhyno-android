// src/hooks/useAndroidBackHandler.ts
import React from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, CommonActions, NavigationProp } from '@react-navigation/native';

// --- ✅ ۱. اصلاحیه ایمپورت ---
// بر اساس فایل Navigation.tsx شما، تایپ‌ها در 'types' هستند نه 'screens'
import type { DrawerParamList } from '../types/navigation.types';

// یک تایپ قوی‌تر برای ناوبری می‌سازیم
type BackHandlerNavigationProp = NavigationProp<DrawerParamList> & {
    getState: () => any; // تابع getState را اضافه می‌کنیم
};

// --- ✅ ۲. اصلاحیه export ---
// مطمئن می‌شویم که کلمه "export" اینجا وجود دارد
export const useAndroidBackHandler = (navigation: BackHandlerNavigationProp) => {
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                const state = navigation.getState();
                const route = state.routes[state.index];
                const currentRouteName = route.name;

                // --- ۱. مدیریت صفحه چت ---
                if (currentRouteName === 'Chat') {
                    const hasChatId = route.params?.chatId;
                    if (hasChatId) {
                        return false;
                    }
                    return false;
                }

                // --- ۲. مدیریت صفحه تنظیمات (Stack) ---
                if (currentRouteName === 'Settings') {
                    const settingsState = route.state;

                    // --- ✅ ۳. اصلاحیه تایپ‌اسکریپt ---
                    // از '?.' استفاده می‌کنیم تا خطای 'undefined' ندهد
                    if ((settingsState?.index ?? 0) > 0) {
                        navigation.goBack();
                        return true;
                    }
                    return false;
                }

                // --- ۳. مدیریت تاریخچه چت ---
                if (currentRouteName === 'ChatList') {
                    return false;
                }

                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [navigation])
    );
};