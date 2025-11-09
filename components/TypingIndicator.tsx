// src/components/TypingIndicator.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

const TypingIndicator = () => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    return (
        <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, animatedStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        height: 32, // ارتفاع ثابت برای جلوگیری از پرش حباب
        justifyContent: 'center',
    },
    typingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#8E8E93',
    },
});

export default React.memo(TypingIndicator);