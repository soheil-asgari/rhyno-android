// RhynoApp/screens/HomeScreen.tsx

import React from 'react';
import { View, Button, Text, StyleSheet, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
    async function handleLogout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.innerContainer}>
                <Text style={styles.text}>شما با موفقیت وارد شدید!</Text>
                <Text style={styles.text}>(اینجا صفحه‌ی چت قرار می‌گیرد)</Text>
                <Button title="خروج از حساب" onPress={handleLogout} color="#FF3B30" />
            </View>
        </SafeAreaView>
    );
}
const FONT_REGULAR = 'Vazirmatn-Medium';
const FONT_BOLD = 'Vazirmatn-Bold';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1e',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: FONT_REGULAR,
    },
});