// context/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase'; // 👈 مسیر Supabase خود را چک کنید
import { Session, User } from '@supabase/supabase-js';

// ۱. تعریف تایپ‌ها
interface ChatContextType {
    // وضعیت احراز هویت
    session: Session | null;
    user: User | null;
    isLoadingAuth: boolean;

    // وضعیت چت
    currentChatId: string | undefined;
    setCurrentChatId: (chatId: string | undefined) => void;

    // وضعیت مدل
    selectedModel: string;
    setSelectedModel: (modelId: string) => void;
    availableModels: { label: string; value: string }[];
    isLoadingModels: boolean;
}

// ۲. ساخت Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ۳. ساخت Provider (تأمین کننده State)
export const ChatProvider = ({ children }: { children: ReactNode }) => {
    // State های احراز هویت
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // State های چت و مدل
    const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o'); // مدل پیش‌فرض

    // State مدل‌های موجود
    const [availableModels, setAvailableModels] = useState<{ label: string; value: string }[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);

    // افکت برای احراز هویت (فقط یک بار)
    useEffect(() => {
        setIsLoadingAuth(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingAuth(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // افکت برای گرفتن لیست مدل‌ها از بک‌اند (فقط یک بار)
    useEffect(() => {
        const fetchModels = async () => {
            setIsLoadingModels(true);
            try {
                const response = await fetch('https://www.rhynoai.ir/api/models'); // ‼️ آدرس بک‌اند
                if (!response.ok) throw new Error('Failed to fetch models');

                const models = await response.json();
                setAvailableModels(models);
            } catch (error) {
                console.error(error);
                setAvailableModels([{ label: 'gpt-4o (Fallback)', value: 'gpt-4o' }]);
            } finally {
                setIsLoadingModels(false);
            }
        };

        fetchModels();
    }, []);

    const value = {
        session,
        user,
        isLoadingAuth,
        currentChatId,
        setCurrentChatId,
        selectedModel,
        setSelectedModel,
        availableModels,
        isLoadingModels,
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};

// ۴. ساخت هوک (Hook) سفارشی برای استفاده آسان
export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};