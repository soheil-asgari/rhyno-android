// context/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface ChatContextType {
    session: Session | null;
    user: User | null;
    isLoadingAuth: boolean;

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
    // مثال GET workspace بر اساس userId
    // واکشی workspace معتبر کاربر
    const fetchUserWorkspace = async (userId: string) => {
        try {
            const response = await fetch(`https://www.rhynoai.ir/api/workspaces?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch workspace');
            const workspaces = await response.json();
            console.log('Workspaces fetched:', workspaces);

            if (!workspaces || workspaces.length === 0) return null;

            const workspace = workspaces[0];
            setWorkspaceEmbeddingsProvider(workspace.embeddings_provider || 'openai'); // مقدار پیش‌فرض openai
            return workspace.id; // فقط id اولین workspace
        } catch (err: any) {
            console.error('Error fetching workspace:', err.message);
            return null;
        }
    };



    // بارگذاری workspaceId و chatSettings پیش‌فرض از API
    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!user?.id) return;
            const wsId = await fetchUserWorkspace(user.id);
            console.log("Workspace ID fetched:", wsId);
            setWorkspaceId(wsId); // فقط id
        };
        fetchWorkspace();
    }, [user]);



    useEffect(() => {
        if (!user) return;
        const fetchWorkspaceAndSettings = async () => {
            try {
                setIsLoadingChatSettings(true);
                // واکشی workspaceId
                const wsRes = await fetch(`https://www.rhynoai.ir/api/workspaces?userId=${user.id}`);
                const workspaces = await wsRes.json();
                if (workspaces?.length > 0) {
                    setWorkspaceId(workspaces[0].id); // اولین workspace کاربر
                }

                // واکشی chat settings پیش‌فرض
                const settingsRes = await fetch('https://www.rhynoai.ir/api/chat-settings');
                const settingsData = await settingsRes.json();
                setChatSettings(settingsData);
                setDefaultChatSettings(settingsData);
            } catch (error) {
                console.error("Error fetching workspace or chat settings:", error);
            } finally {
                setIsLoadingChatSettings(false);
            }
        };
        fetchWorkspaceAndSettings();
    }, [user]);

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


    // واکشی مدل‌ها
    useEffect(() => {
        const fetchModels = async () => {
            setIsLoadingModels(true);
            try {
                const res = await fetch('https://www.rhynoai.ir/api/models');
                if (!res.ok) throw new Error('Failed to fetch models');
                const models = await res.json(); // [{label, value}, ...]
                setAvailableModels(models);

                // جداگانه MODEL_PROMPTS هم fetch کن
                const promptsRes = await fetch('https://www.rhynoai.ir/api/prompt');
                if (!promptsRes.ok) throw new Error('Failed to fetch prompts');
                const promptsData = await promptsRes.json();
                setModelPrompts(promptsData);
                console.log(promptsData);
            } catch (err) {
                console.error(err);
                setAvailableModels([{ label: 'gpt-4o (Fallback)', value: 'gpt-4o' }]);
                setModelPrompts({});
            } finally {
                setIsLoadingModels(false);
            }
        };
        fetchModels();
    }, []);
    const fetchMessages = async (chatId: string) => {
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
    };

    const createMessage = async (message: any) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!res.ok) throw new Error('Failed to create message');
        const data = await res.json();
        setMessages(prev => [...prev, data]);
        return data;
    };

    const updateMessage = async (messageId: string, message: any) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: messageId, ...message }),
        });
        if (!res.ok) throw new Error('Failed to update message');
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === data.id ? data : m));
        return data;
    };

    const deleteMessage = async (messageId: string) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server?id=${messageId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete message');
        setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const deleteMessagesIncludingAndAfter = async (sequenceNumber: number) => {
        const res = await fetch(`https://www.rhynoai.ir/api/message.server/delete-sequence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: currentChatId, sequenceNumber }),
        });
        if (!res.ok) throw new Error('Failed to delete messages');
        fetchMessages(currentChatId!);
    };

    const value: ChatContextType = {
        session,
        user,
        isLoadingAuth,
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

    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
