// src/components/CopyableCodeBlock.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { ColorfulText } from './ColorfulText'; // (این کامپوننت را از قبل داشتید)
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    content: string;
    attributes: any;
};

const CopyableCodeBlock = ({ content, attributes }: Props) => {

    const language = attributes?.lang ? attributes.lang : 'text';

    const handleCopy = () => {
        if (content) {
            Clipboard.setString(content);
            Toast.show({ type: 'success', text1: 'کد کپی شد!' });
        }
    };

    return (
        <View style={styles.codeBlockWrapper}>
            {/* هدر بلاک کد */}
            <View style={styles.codeBlockHeader}>
                <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                    <Icon name="copy-outline" size={18} color="#9E9E9E" />
                </TouchableOpacity>
                {/* ... می‌توانید تگ زبان را هم اینجا اضافه کنید ... */}
            </View>

            <ScrollView
                horizontal={true}
                style={styles.codeBlockScroll}
                contentContainerStyle={styles.codeBlockScrollContent}
            >
                <ColorfulText
                    text={content}
                    style={styles.codeBlockText}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    codeBlockWrapper: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginVertical: 5,
        overflow: 'hidden',
    },
    codeBlockHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // دکمه کپی در انتها
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    codeBlockScrollContent: {
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    codeBlockScroll: {
        // maxHeight: 300, // (اختیاری)
    },
    copyButton: {
        padding: 5,
    },
    codeBlockText: {
        color: '#EAEAEA',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
        writingDirection: 'ltr',
        textAlign: 'left',
    },
});

export default React.memo(CopyableCodeBlock);