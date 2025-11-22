// context/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// ✅ تعریف یک نوع ساده برای چت
interface Chat {
    id: string;
    name: string;
    updated_at: string;
    // ... هر فیلد دیگری که از جدول 'chats' نیاز دارید
}

interface ChatContextType {
    session: Session | null;
    user: User | null;
    isLoadingAuth: boolean;

    // ✅ مدیریت لیست چت‌ها (برای سایدبار/تاریخچه)
    chats: Chat[];
    fetchChats: () => Promise<void>;
    removeChatFromList: (chatId: string) => void;

    currentChatId: string | undefined;
    setCurrentChatId: (chatId: string | undefined) => void;

    selectedModel: string;
    setSelectedModel: (modelId: string) => void;
    availableModels: { label: string; value: string }[];
    isLoadingModels: boolean;

    chatSettings: Record<string, any>;
    isLoadingChatSettings: boolean;
    modelPrompts: Record<string, string>;
    workspaceId: string | null;
    defaultChatSettings: Record<string, any>;
    workspaceEmbeddingsProvider: string | null;

    // ✅ مدیریت پیام‌های چت فعلی
    messages: any[];
    isLoadingMessages: boolean;
    fetchMessages: (chatId: string) => Promise<void>;
    createMessage: (message: any) => Promise<any>;
    updateMessage: (messageId: string, message: any) => Promise<any>;
    deleteMessage: (messageId: string) => Promise<void>;
    deleteMessagesIncludingAndAfter: (sequenceNumber: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const [chats, setChats] = useState<Chat[]>([]); // ✅ State جدید برای لیست چت‌ها
    const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
    const [workspaceEmbeddingsProvider, setWorkspaceEmbeddingsProvider] = useState<string | null>(null);
    const [availableModels, setAvailableModels] = useState<{ label: string; value: string }[]>([]);
    const [modelPrompts, setModelPrompts] = useState<Record<string, string>>({});
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

    const [isLoadingModels, setIsLoadingModels] = useState(true);

    const [chatSettings, setChatSettings] = useState<Record<string, any>>({});
    const [isLoadingChatSettings, setIsLoadingChatSettings] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);
    const [defaultChatSettings, setDefaultChatSettings] = useState<Record<string, any>>({});

    // --- توابع Auth (این بخش دست نخورده) ---
    useEffect(() => {
        const fetchSession = async () => {
            setIsLoadingAuth(true);
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingAuth(false);
        };
        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- توابع مربوط به لیست چت‌ها ---

    // ✅ واکشی لیست چت‌ها (برای سایدبار)
    const fetchChats = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('chats')
                .select('id, name, updated_at') // فقط فیلدهای مورد نیاز
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setChats(data || []);
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    }, [user]); // وابسته به user

    // ✅ حذف چت از State (برای آپدیت آنی UI)
    const removeChatFromList = useCallback((chatId: string) => {
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    }, []); // این تابع به هیچ stateی وابسته نیست

    // --- توابع مربوط به پیام‌ها (همگی با useCallback) ---

    const fetchMessages = useCallback(async (chatId: string) => {
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`https://www.rhynoai.ir/api/message.server?chat_id=${chatId}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error(error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    }, []); // ✅ useCallback

    const createMessage = useCallback(async (message: any) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!res.ok) throw new Error('Failed to create message');
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        return data;
    }, []); // ✅ useCallback

    const updateMessage = useCallback(async (messageId: string, message: any) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: messageId, ...message }),
        });
        if (!res.ok) throw new Error('Failed to update message');
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === data.id ? data : m));
        return data;
    }, []); // ✅ useCallback

    const deleteMessage = useCallback(async (messageId: string) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server?id=${messageId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete message');
        setMessages(prev => prev.filter(m => m.id !== messageId));
    }, []); // ✅ useCallback

    const deleteMessagesIncludingAndAfter = useCallback(async (sequenceNumber: number) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server/delete-sequence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: currentChatId, sequenceNumber }),
        });
        if (!res.ok) throw new Error('Failed to delete messages');
        fetchMessages(currentChatId!);
    }, [currentChatId, fetchMessages]); // ✅ useCallback

    // --- افکت اصلی بارگذاری داده‌ها (ادغام شده و بهینه) ---
    useEffect(() => {
        if (!user?.id) return;

        const fetchInitialData = async () => {
            try {
                setIsLoadingChatSettings(true);
                setIsLoadingModels(true);

                // --- ۱. واکشی Workspace و Settings (ادغام شده) ---
                const wsRes = await fetch(`https://www.rhynoai.ir/api/workspaces?userId=${user.id}`);
                const workspaces = await wsRes.json();
                if (workspaces?.length > 0) {
                    const ws = workspaces[0];
                    setWorkspaceId(ws.id);
                    setWorkspaceEmbeddingsProvider(ws.embeddings_provider || 'openai');
                }

                const settingsRes = await fetch('https://www.rhynoai.ir/api/chat-settings');
                const settingsData = await settingsRes.json();
                setChatSettings(settingsData);
                setDefaultChatSettings(settingsData);
                setIsLoadingChatSettings(false);

                // --- ۲. واکشی Models و Prompts ---
                const modelsRes = await fetch('https://www.rhynoai.ir/api/models');
                if (!modelsRes.ok) throw new Error('Failed to fetch models');
                const models = await modelsRes.json();
                setAvailableModels(models);

                const promptsRes = await fetch('https://www.rhynoai.ir/api/prompt');
                if (!promptsRes.ok) throw new Error('Failed to fetch prompts');
                const promptsData = await promptsRes.json();
                setModelPrompts(promptsData);
                setIsLoadingModels(false);

                // --- ۳. ✅ واکشی لیست چت‌ها ---
                await fetchChats();

            } catch (error) {
                console.error("Error fetching initial data:", error);
                // بازگرداندن به حالت پیش‌فرض در صورت خطا
                setIsLoadingChatSettings(false);
                setIsLoadingModels(false);
                setAvailableModels([{ label: 'gpt-4o-mini (Fallback)', value: 'gpt-4o-mini' }]);
            }
        };

        fetchInitialData();
    }, [user, fetchChats]); // ✅ وابسته به user و تابع fetchChats (که خودش به user وابسته است)

    // --- ارائه دهنده Context (با useMemo بهینه شده) ---
    const value: ChatContextType = useMemo(() => ({
        session,
        user,
        isLoadingAuth,
        chats, // ✅
        fetchChats, // ✅
        removeChatFromList, // ✅
        currentChatId,
        setCurrentChatId,
        selectedModel,
        setSelectedModel,
        availableModels,
        isLoadingModels,
        chatSettings,
        isLoadingChatSettings,
        workspaceId,
        defaultChatSettings,
        workspaceEmbeddingsProvider,
        modelPrompts,
        deleteMessagesIncludingAndAfter,
        deleteMessage,
        updateMessage,
        createMessage,
        fetchMessages,
        messages,
        isLoadingMessages,
    }), [
        // ✅ لیست وابستگی کامل (شامل توابع useCallback)
        session,
        user,
        isLoadingAuth,
        chats,
        fetchChats,
        removeChatFromList,
        currentChatId,
        selectedModel,
        availableModels,
        isLoadingModels,
        chatSettings,
        isLoadingChatSettings,
        workspaceId,
        defaultChatSettings,
        workspaceEmbeddingsProvider,
        modelPrompts,
        deleteMessagesIncludingAndAfter,
        deleteMessage,
        updateMessage,
        createMessage,
        fetchMessages,
        messages,
        isLoadingMessages
    ]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};