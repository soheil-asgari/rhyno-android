// ✅ hooks/useVoiceRecorder.ts (اصلاح شده)
import { useState, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';

type RecordingStatus = 'idle' | 'preparing' | 'recording' | 'stopped';

// این اینترفیس بازگشتی هوک است
export interface UseVoiceRecorderResult {
    status: RecordingStatus;
    handleToggleRecording: () => void;
    recordingUri: string | null;
    durationMillis: number;
}

// این اینترفیس ورودی هوک است
interface VoiceRecorderProps {
    onRecordingComplete: (uri: string, duration: number) => void;
}

export const useVoiceRecorder = ({
    onRecordingComplete,
}: VoiceRecorderProps): UseVoiceRecorderResult => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [durationMillis, setDurationMillis] = useState(0);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);

    const recordingRef = useRef<Audio.Recording | null>(null);
    // 🛑 اصلاح خطا: نوع تایمر در React Native برابر number است
    const intervalRef = useRef<number | null>(null);

    const requestPermissions = async (): Promise<boolean> => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'خطای دسترسی',
                    'برای ضبط صدا، نیاز به دسترسی میکروفون است.',
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Failed to get permissions', error);
            return false;
        }
    };

    const startTimer = () => {
        let startTime = Date.now();
        // 🛑 اصلاح خطا: setInterval یک number برمی‌گرداند
        intervalRef.current = setInterval(() => {
            setDurationMillis(Date.now() - startTime);
        }, 100) as any; // استفاده از any برای سازگاری بیشتر (یا number)
    };

    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const startRecording = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setStatus('preparing');
        setDurationMillis(0);

        try {
            // ✅✅✅ ۲. استفاده از مقادیر عددی به جای enum
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                interruptionModeAndroid: 2, // (DoNotMix)
                shouldDuckAndroid: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: false,
            });

            const recording = new Audio.Recording();
            recordingRef.current = recording;

            // ✅✅✅ ۳. استفاده از مقادیر عددی برای پریست
            const recordingOptions: Audio.RecordingOptions = {
                isMeteringEnabled: true,
                android: {
                    extension: '.m4a',
                    outputFormat: 2, // (MPEG_4)
                    audioEncoder: 3, // (AAC)
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.m4a',
                    outputFormat: 2, // (MPEG4AAC)
                    audioQuality: 127, // (MAX)
                    sampleRate: 44100,
                    numberOfChannels: 2,
                    bitRate: 128000,
                },
                web: {},
            };

            await recording.prepareToRecordAsync(recordingOptions);
            await recording.startAsync();

            setStatus('recording');
            startTimer();
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('خطا', 'امکان شروع ضبط صدا وجود نداشت.');

            if (recordingRef.current) {
                try {
                    await recordingRef.current.stopAndUnloadAsync();
                } catch (e) { /* (نادیده گرفتن) */ }
                recordingRef.current = null;
            }
            setStatus('idle');
        }
    };

    const stopRecording = async () => {
        if (!recordingRef.current) return;

        setStatus('stopped');
        stopTimer();

        try {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            const status = await recordingRef.current.getStatusAsync();
            recordingRef.current = null;

            // ✅✅✅ ۴. ریست کردن با مقادیر عددی
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                interruptionModeAndroid: 1, // (DuckOthers)
                shouldDuckAndroid: false,
                staysActiveInBackground: false,
                playThroughEarpieceAndroid: false,
            });

            if (uri && status.isDoneRecording) {
                // ... (مثل قبل)
                onRecordingComplete(uri, status.durationMillis);
            } else {
                Alert.alert('خطا', 'فایل صوتی به درستی ذخیره نشد.');
            }
            setStatus('idle');

        } catch (error) {
            console.error('Failed to stop recording', error);
            Alert.alert('خطا', 'مشکلی در توقف ضبط رخ داد.');

            recordingRef.current = null;
            setStatus('idle');
        }
    };

    const handleToggleRecording = () => {
        if (status === 'recording') {
            stopRecording();
        } else if (status === 'idle') {
            startRecording();
        }
    };

    return {
        status,
        handleToggleRecording,
        recordingUri,
        durationMillis,
    };
};