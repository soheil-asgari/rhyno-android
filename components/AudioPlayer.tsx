// src/components/AudioPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';

// تابع کمکی برای فرمت زمان (01:30)
const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({ uri }: { uri: string }) => {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // تابع آپدیت وضعیت پخش
    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
            if (status.error) {
                console.error(`Error loading audio: ${status.error}`);
                setIsLoading(false);
            }
            return;
        }
        setDuration(status.durationMillis || 0);
        setPosition(status.positionMillis || 0);
        setIsPlaying(status.isPlaying);
        setIsLoading(!status.isLoaded);

        // اگر به انتها رسید، متوقف شود
        if (status.didJustFinish) {
            soundRef.current?.stopAsync();
            setPosition(0);
        }
    };

    // افکت Load/Unload صدا
    useEffect(() => {
        const loadSound = async () => {
            setIsLoading(true);
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: false },
                    onPlaybackStatusUpdate
                );
                soundRef.current = sound;
            } catch (error) {
                console.error('Failed to load sound', error);
            }
        };

        loadSound();

        // Cleanup: Unload صدا هنگام بسته شدن کامپوننت
        return () => {
            soundRef.current?.unloadAsync();
        };
    }, [uri]);

    // هندلر Play/Pause
    const handlePlayPause = async () => {
        if (!soundRef.current) return;
        if (isPlaying) {
            await soundRef.current.pauseAsync();
        } else {
            await soundRef.current.playAsync();
        }
    };

    // هندلر تغییر اسلایدر
    const onSliderValueChange = async (value: number) => {
        if (soundRef.current) {
            // (موقت پاز کن تا پرش نکند)
            if (isPlaying) await soundRef.current.pauseAsync();
            setPosition(value);
        }
    };

    const onSlidingComplete = async (value: number) => {
        if (soundRef.current) {
            await soundRef.current.setPositionAsync(value);
            // (اگر قبلاً در حال پخش بود، ادامه بده)
            if (isPlaying) await soundRef.current.playAsync();
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handlePlayPause} disabled={isLoading}>
                <Icon
                    name={isLoading ? "hourglass-outline" : (isPlaying ? "pause-circle" : "play-circle")}
                    size={36}
                    color="#fff"
                />
            </TouchableOpacity>
            <View style={styles.sliderContainer}>
                <Slider
                    style={styles.slider}
                    value={position}
                    minimumValue={0}
                    maximumValue={duration}
                    onValueChange={onSliderValueChange}
                    onSlidingComplete={onSlidingComplete}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#8E8E93"
                    thumbTintColor="#FFFFFF"
                />
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>
        </View>
    );
};

const FONT_REGULAR = 'Vazirmatn-Medium';
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginVertical: 5,
    },
    sliderContainer: {
        flex: 1,
        marginLeft: 10,
    },
    slider: {
        width: '100%',
        height: 20, // کاهش ارتفاع برای UI موبایل
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5, // (پدینگ برای تراز با اسلایدر)
    },
    timeText: {
        color: '#EAEAEA',
        fontSize: 12,
        fontFamily: FONT_REGULAR,
    },
});