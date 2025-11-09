// components/ChatHeader.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatHeaderProps {
    onMenuPress: () => void;
    onNewChatPress: () => void;
    onOptionsPress: () => void;
}

export default React.memo(function ChatHeader({
    onMenuPress,
    onNewChatPress,
    onOptionsPress,
}: ChatHeaderProps) {
    return (
        <View style={styles.header}>
            {/* بخش چپ: منو (بدون تغییر) */}
            <View style={styles.leftSection}>
                <Icon name="menu-outline" size={28} color="#fff" onPress={onMenuPress} />
            </View>

            {/* بخش وسط: خالی (یا می‌توانید بعداً نام مدل را اینجا بگذارید) */}
            <View style={styles.middleSection}>
                {/* <Text style={styles.headerTitle}>RhynoAI</Text> */}
            </View>

            {/* بخش راست: شامل دو آیکون */}
            <View style={styles.rightSection}>
                {/* 👇 آیکون چت جدید به اینجا منتقل شد */}
                <FontAwesome5
                    name="pen-square"
                    size={24}
                    color="#fff"
                    onPress={onNewChatPress}
                    style={styles.rightIcon} // 👈 استایل برای فاصله
                />

                <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={28}
                    color="#fff"
                    onPress={onOptionsPress}
                />
            </View>
        </View>
    );

});
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        backgroundColor: '#000000',
        minHeight: 60,
        borderBottomWidth: 0,
    },
    leftSection: {
        width: 50,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    middleSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // (اختیاری) استایل برای نام هدر در وسط
    // headerTitle: {
    //     color: 'white',
    //     fontSize: 18,
    //     fontWeight: '600',
    // },
    rightSection: {
        width: 80, // 👈 فضا را برای دو آیکون بیشتر کنید
        flexDirection: 'row',
        justifyContent: 'flex-end', // چسبیده به راست
        alignItems: 'center',
    },
    rightIcon: {
        marginRight: 15, // 👈 فاصله بین دو آیکون
    },
});