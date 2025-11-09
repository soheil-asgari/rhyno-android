// ✅ components/CircularAudioVisualizer.tsx (اصلاح شده)
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons'; // آیکون میکروفون

const { width } = Dimensions.get('window');
const VISUALIZER_SIZE = width * 0.5; // اندازه ویژوالایزر
const NUM_BARS = 30; // تعداد نوارها (کمتر برای پرفورمنس موبایل)
const BAR_WIDTH = 4;
const RADIUS = VISUALIZER_SIZE / 2 - 20;

const Bar = ({ index }: { index: number }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        const delay = Math.random() * 1000;

        setTimeout(() => {
            progress.value = withRepeat(
                withTiming(1, {
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                }),
                -1,
                true,
            );
        }, delay);
    }, [progress]);

    const animatedStyle = useAnimatedStyle(() => {
        const height = interpolate(
            progress.value,
            [0, 1],
            [10, 40],
        );
        const opacity = interpolate(
            progress.value,
            [0, 1],
            [0.5, 1],
        );

        return {
            height,
            opacity,
        };
    });

    const angle = (index * (360 / NUM_BARS)); // 🛑 اصلاح خطا: نیازی به % 360 نیست
    const rotate = `${angle}deg`;

    // 🛑 اصلاح خطا: متغیر angle یک عدد است و .slice ندارد
    const hue = 200 + (angle / 360) * 80;
    const backgroundColor = `hsl(${hue}, 100%, 60%)`;

    return (
        <View
            style={[
                styles.barContainer,
                {
                    transform: [{ rotate }],
                },
            ]}>
            <Animated.View
                style={[
                    styles.bar,
                    { backgroundColor },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

export const CircularAudioVisualizer = () => {
    return (
        <View style={styles.container}>
            {/* آیکون میکروفون در مرکز */}
            <Icon name="mic" size={40} color="#fff" style={styles.micIcon} />
            {Array.from({ length: NUM_BARS }).map((_, i) => (
                <Bar key={i} index={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: VISUALIZER_SIZE,
        height: VISUALIZER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    micIcon: {
        position: 'absolute', // روی نوارها قرار می‌گیرد
    },
    barContainer: {
        position: 'absolute',
        left: (VISUALIZER_SIZE - BAR_WIDTH) / 2,
        top: (VISUALIZER_SIZE - BAR_WIDTH) / 2,
        width: BAR_WIDTH,
        height: VISUALIZER_SIZE,
        justifyContent: 'flex-start',
    },
    bar: {
        width: BAR_WIDTH,
        borderRadius: BAR_WIDTH / 2,
        transform: [{ translateY: -RADIUS }],
    },
});