import { DrawerNavigationProp } from '@react-navigation/drawer';

// ۱. تایپ‌های Stack تنظیمات
export type SettingsStackParamList = {
    SettingsMain: undefined;
    CustomPayment: undefined;
};

// ۲. تایپ‌های Drawer
export type DrawerParamList = {
    ChatList: undefined;
    Chat: { chatId?: string };
    Settings: undefined;
};

// ۳. تایپ اصلی که ChatScreen به آن نیاز دارد
export type DrawerNavigationType = DrawerNavigationProp<DrawerParamList>;