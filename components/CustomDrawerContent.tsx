// components/CustomDrawerContent.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Modal, // ✅ ایمپورت جدید
    FlatList, // ✅ ایمپورت جدید
    Pressable, // ✅ ایمپورت جدید
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
// ❌ RNPickerSelect حذف شد
import Icon from 'react-native-vector-icons/Ionicons';
import { useChat } from '../context/ChatContext';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../types/navigation.types';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ [جدید] تعریف نوع برای آیتم‌های مدل
type ModelItem = {
    label: string;
    value: string;
};

// ✅ [جدید] کامپوننت مدال سفارشی برای انتخاب مدل
const ModelPickerModal = ({
    isVisible,
    onClose,
    models,
    onSelect,
    currentValue,
}: {
    isVisible: boolean;
    onClose: () => void;
    models: ModelItem[];
    onSelect: (value: string) => void;
    currentValue: string;
}) => {
    return (
        <Modal
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            animationType="fade"
        >
            {/* پس‌زمینه نیمه‌شفاف که با کلیک بسته می‌شود */}
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                {/* کانتینر اصلی لیست مدل‌ها */}
                <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>انتخاب مدل</Text>
                    <FlatList
                        data={models}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => onSelect(item.value)}
                            >
                                <Text style={styles.modalItemText}>{item.label}</Text>
                                {/* تیک برای آیتم انتخاب‌شده */}
                                {item.value === currentValue && (
                                    <Icon name="checkmark-circle" color="#20a0f0" size={22} />
                                )}
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                    />
                </View>
            </Pressable>
        </Modal>
    );
};


export function CustomDrawerContent(props: any) {
    const {
        selectedModel,
        setSelectedModel,
        availableModels,
        isLoadingModels,
        setCurrentChatId,
    } = useChat();

    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ✅ [جدید] استیت برای باز و بسته کردن مدال سفارشی
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleNewChat = () => {
        setCurrentChatId(undefined);
        navigation.navigate('Chat', { chatId: undefined });
        props.navigation.closeDrawer();
    };

    // ✅ [اصلاح] این تابع حالا توسط مدال سفارشی فراخوانی می‌شود
    const handleModelChange = (value: string) => {
        setSelectedModel(value);
        setIsModalVisible(false); // بستن مدال پس از انتخاب
    };

    const handleLogout = async () => {
        // ... (منطق خروج مثل قبل)
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("خطا در خروج");
            setIsLoggingOut(false);
        }
    };

    // ✅ [جدید] پیدا کردن لیبل مدل انتخاب‌شده برای نمایش
    const selectedModelLabel = useMemo(() => {
        return availableModels.find(m => m.value === selectedModel)?.label || selectedModel;
    }, [availableModels, selectedModel]);

    return (
        <LinearGradient colors={['#111', '#050505']} style={{ flex: 1 }}>
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'space-between',
                }}
            >
                {/* === بخش بالا: چت جدید و ناوبری === */}
                <View style={styles.topSection}>
                    <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
                        <LinearGradient
                            colors={['#20a0f0', '#007BFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.newChatGradient}
                        >
                            <Icon name="add" color={'#fff'} size={26} />
                            <Text style={styles.newChatLabel}>چت جدید</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <DrawerItemList {...props} />
                </View>

                {/* === بخش پایین: تنظیمات و خروج === */}
                <View style={styles.bottomSection}>
                    <View style={styles.modelSelectorContainer}>
                        <Text style={styles.modelLabel}>انتخاب مدل</Text>

                        {/* ✅ [بازطراحی UI] دکمه‌ای که شبیه انتخاب‌گر است و مدال را باز می‌کند */}
                        <TouchableOpacity
                            style={styles.modelPickerWrapper}
                            onPress={() => setIsModalVisible(true)} // مدال را باز می‌کند
                            disabled={isLoadingModels}
                        >
                            {isLoadingModels ? (
                                <ActivityIndicator color="#fff" style={{ height: 40 }} />
                            ) : (
                                <>
                                    {/* نمایش لیبل مدل انتخاب‌شده */}
                                    <Text style={styles.modelPickerText}>{selectedModelLabel}</Text>
                                    <Icon name="chevron-down-outline" color="#888" size={20} style={styles.pickerIcon} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.separator} />

                    <DrawerItem
                        label="خروج"
                        labelStyle={[
                            styles.logoutLabel,
                            isLoggingOut && { color: '#888' }
                        ]}
                        icon={() => (
                            isLoggingOut ? (
                                <ActivityIndicator size="small" color="#888" />
                            ) : (
                                <Icon name="log-out-outline" color={'#FF3B30'} size={22} />
                            )
                        )}
                        onPress={handleLogout}
                    />
                </View>
            </DrawerContentScrollView>

            {/* ✅ [جدید] رندر کردن مدال سفارشی (خارج از ScrollView) */}
            <ModelPickerModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                models={availableModels}
                onSelect={handleModelChange}
                currentValue={selectedModel}
            />
        </LinearGradient>
    );
}

const FONT_REGULAR = 'Vazirmatn-Medium';

const styles = StyleSheet.create({
    topSection: {
        paddingTop: 10,
    },
    bottomSection: {
        paddingBottom: 20,
    },
    // --- دکمه چت جدید ---
    newChatButton: {
        marginHorizontal: 10,
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    newChatGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    newChatLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: FONT_REGULAR,
        marginLeft: 15,
    },

    // --- انتخاب‌گر مدل ---
    modelSelectorContainer: {
        paddingHorizontal: 20,
        marginVertical: 10,
        paddingTop: 15,
    },
    modelLabel: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 10,
        fontFamily: FONT_REGULAR,
    },
    // ✅ [اصلاح] این Wrapper حالا یک TouchableOpacity است
    modelPickerWrapper: {
        backgroundColor: '#222',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'ios' ? 12 : 10, // تنظیم ارتفاع
        paddingHorizontal: 15,
        height: Platform.OS === 'ios' ? 48 : 46, // ارتفاع ثابت
    },
    // ✅ [جدید] استایل متن مدل انتخاب‌شده
    modelPickerText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: FONT_REGULAR,
        color: 'white',
        paddingRight: 30, // جا برای آیکون
    },
    pickerIcon: {
        position: 'absolute',
        right: 15,
        top: '50%',
        marginTop: -10,
    },

    // --- جداکننده و خروج ---
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 15,
        marginHorizontal: 20,
    },
    logoutLabel: {
        color: '#FF3B30',
        fontWeight: '600',
        fontFamily: FONT_REGULAR,
    },

    // ✅✅✅ [جدید] استایل‌های مدال سفارشی ✅✅✅
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // پس‌زمینه تاریک
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    modalContainer: {
        backgroundColor: '#1E1E1E', // پس‌زمینه مدال
        borderRadius: 15,
        paddingVertical: 10,
        width: '100%',
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: '#444',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: FONT_REGULAR,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    modalItemText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: FONT_REGULAR,
    },
    modalSeparator: {
        height: 1,
        backgroundColor: '#333',
        marginHorizontal: 20,
    },
});

