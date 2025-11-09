import React from 'react';
import { Text } from 'react-native';

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A66DD4', '#FF9F45'];

const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const getColorForWord = (word: string) => {
    const index = hashCode(word) % COLORS.length;
    return COLORS[index];
};

export const ColorfulText = ({ text, style }: { text: string; style?: any }) => {
    if (!text) return null;

    // تقسیم متن به خطوط
    const lines = text.split('\n');

    return (
        <Text style={{ flexWrap: 'wrap', flexDirection: 'column' }}>
            {lines.map((line, lineIndex) => (
                <Text key={lineIndex} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {line.split(/(\s+)/).map((word, i) => {
                        // word شامل فاصله هم هست، پس فاصله رو نگه می‌داره
                        const color = word.trim() ? getColorForWord(word) : undefined;
                        return (
                            <Text key={i} style={[style, color ? { color } : {}]}>
                                {word}
                            </Text>
                        );
                    })}
                    {/* newline بعد هر خط */}
                    {lineIndex < lines.length - 1 && '\n'}
                </Text>
            ))}
        </Text>
    );
};
