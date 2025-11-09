// src/hooks/useChatLogic.ts
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';
import { DocumentPickerAsset } from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import 'text-encoding-polyfill'; // (این ایمپورت مهم است)

// وابستگی‌های پروژه شما
import { supabase } from '../lib/supabase';
import { useChat } from '../context/ChatContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useAttachmentPicker } from '../hooks/useAttachmentPicker';

// ابزارهایی که در فاز ۱ ساختیم
import { createBotMessage, getTimestamp } from '../utils/chatUtils';

// 🛑 آدرس بک‌اند را اینجا تعریف می‌کنیم
const YOUR_BACKEND_URL = 'https://www.rhynoai.ir';

// تعریف نوع داده برای فایل ضمیمه
type StagedFileState = {
    asset: DocumentPickerAsset;
    status: 'uploading' | 'uploaded' | 'error';
    uploadedPath?: string;
    error?: string;
};
const JSON_MODELS = [
    "gpt-4o-mini-tts", // (مدل TTS شما)
    "dall-e-3",
    "gpt-5",
    "gpt-5-mini",
    "gpt-4o-transcribe"
];

// ----------------------------------------------------------------
//
//               🔥 هوک اصلی منطق چت 🔥
//
// ----------------------------------------------------------------
const TTS_MODEL_ID = "gpt-4o-mini-tts";
export const useChatLogic = () => {

    //
    // 🛑 === ۱. CONTEXT, STATE & REFS ===
    //
    const {
        session,
        user,
        isLoadingAuth,
        currentChatId,
        setCurrentChatId,
        selectedModel,
        setSelectedModel,
        workspaceId,
        defaultChatSettings,
        workspaceEmbeddingsProvider,
        modelPrompts
    } = useChat();

    // --- State ---
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [stagedFileState, setStagedFileState] = useState<StagedFileState | null>(null);
    const [stagedImage, setStagedImage] = useState<string | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [inputKey, setInputKey] = useState('input-key-1');
    const [isSending, setIsSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [currentChatName, setCurrentChatName] = useState<string | null>(null);
    const [editText, setEditText] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [micPermissionGranted, setMicPermissionGranted] = useState(false);

    // --- Refs ---
    const isCreatingChatRef = useRef(false);
    const accumulatedTextRef = useRef('');
    const typingMessageIdRef = useRef<string | number | null>(null);
    const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    //
    // 🛑 === ۲. MEMOIZED VALUES ===
    //
    const { lastUserMessageId, lastBotMessageId } = useMemo(() => {
        const reversedMessages = [...messages].reverse();
        const lastUserMsg = reversedMessages.find(m => m.user._id === 1 && !(m as any).isTyping);
        const lastBotMsg = reversedMessages.find(m => m.user._id === 2 && !(m as any).isTyping);
        return {
            lastUserMessageId: lastUserMsg?._id,
            lastBotMessageId: lastBotMsg?._id,
        };
    }, [messages]);

    const { displayName, firstName } = useMemo(() => {
        const dName = user?.user_metadata?.display_name ||
            user?.user_metadata?.username ||
            user?.email ||
            "کاربر";
        const fName = dName.replace(/[0-9]/g, "").split(/[\s@,.;]+/)[0];
        return { displayName: dName, firstName: fName };
    }, [user]);

    const chatSettings = useMemo(() => ({
        model: selectedModel
    }), [selectedModel]);

    const isRealtimeModel = useCallback((modelId: string): boolean => {
        return (
            modelId.includes('realtime') ||
            modelId.includes('gpt-4o-voice')
        );
    }, []);

    //
    // 🛑 === ۳. CORE FUNCTIONS (Streaming, Fetching, API Calls) ===
    //

    const startStreamingUpdates = useCallback(() => {
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = setInterval(() => {
            if (!typingMessageIdRef.current) return;
            const currentText = accumulatedTextRef.current;
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === typingMessageIdRef.current
                        ? { ...msg, text: currentText.length ? currentText : '' }
                        : msg,
                ),
            );
        }, 200);
    }, [setMessages]); // setMessages

    const stopStreamingUpdates = useCallback((
        isError: boolean = false,
        assistantImage: string | null = null
    ) => {
        if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;

        if (!isError && typingMessageIdRef.current) {
            const finalText = accumulatedTextRef.current;
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === typingMessageIdRef.current
                        ? {
                            ...msg,
                            text: finalText || 'پاسخی دریافت نشد.',
                            image: assistantImage || undefined,
                            isTyping: false,
                        }
                        : msg,
                ),
            );
        } else if (isError && typingMessageIdRef.current) {
            const errorText = accumulatedTextRef.current || "خطا";
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === typingMessageIdRef.current
                        ? { ...msg, text: errorText, isTyping: false }
                        : msg
                )
            );
        }

        accumulatedTextRef.current = '';
        typingMessageIdRef.current = null;
        setIsSending(false);
    }, [setMessages, setIsSending]); // setMessages, setIsSending

    const fetchMessages = useCallback(async (chatId: string) => {
        if (!chatId) {
            setMessages([]);
            setLoadingMessages(false);
            setInitialLoadComplete(true);
            return;
        }
        setLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('id, content, role, created_at, model, image_paths, audio_url')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedMessages: IMessage[] = (data || []).map((msg: any) => {
                let textContent = msg.content || '';
                let imageUri: string | undefined = undefined;

                // --- ۱. چک کردن image_paths (مسیر استاندارد) ---
                if (msg.image_paths && Array.isArray(msg.image_paths) && msg.image_paths.length > 0) {
                    const path = msg.image_paths[0];
                    if (path && path.startsWith('data:image')) {
                        imageUri = path;
                    } else if (path) {
                        const { data: publicUrlData } = supabase.storage
                            .from('message_images') // <--- نام باکت شما
                            .getPublicUrl(path);   // <--- مسیری که از دیتابیس خواندیم
                        imageUri = publicUrlData.publicUrl;
                    }
                }

                // ✅✅✅✅✅ شروع منطق جدید ✅✅✅✅✅
                const SEPARATOR = '%RHINO_IMAGE_SEPARATOR%';

                // --- ۲. چک کردن SEPARATOR در content (مخصوص DALL-E) ---
                // (اگر منطق ۱ عکسی پیدا نکرد، این را امتحان کن)
                if (!imageUri && textContent.includes(SEPARATOR)) {
                    const parts = textContent.split(SEPARATOR);
                    textContent = parts[0]?.replace(/%$/, '').trim(); // متن واقعی
                    let imageData = parts[1]?.replace(/%$/, '').trim(); // داده عکس

                    if (imageData?.startsWith('http') || imageData?.startsWith('data:image')) {
                        imageUri = imageData;
                    } else if (imageData && imageData.length > 50) {
                        // همان منطق تمیز کردن base64 از MessageItem
                        const potentialBase64 = imageData.replace(/\n/g, '');
                        if (!potentialBase64.includes(' ')) {
                            imageUri = `data:image/png;base64,${potentialBase64}`;
                        }
                    }
                }
                // --- ۳. فال‌بک نهایی (برای عکس‌های base64 خیلی قدیمی) ---
                else if (!imageUri && msg.role === 'assistant' && textContent.length > 200) {
                    const potentialBase64 = textContent.replace(/\n/g, '');
                    if (!potentialBase64.includes(' ')) {
                        imageUri = `data:image/png;base64,${potentialBase64}`;
                        textContent = ''; // متن را پاک کن چون عکس است
                    }
                }

                let fileAssetForMessage: DocumentPickerAsset | null = null;
                if (textContent.includes('(فایل ضمیمه:')) {
                    try {
                        const fileName = textContent.split('(فایل ضمیمه:')[1].split(')')[0];
                        if (fileName) {
                            fileAssetForMessage = { name: fileName } as DocumentPickerAsset;
                        }
                    } catch (e) { }
                }

                return {
                    _id: msg.id,
                    text: textContent,
                    createdAt: new Date(msg.created_at),
                    user: {
                        _id: msg.role === 'user' ? 1 : 2,
                        name: msg.role === 'user' ? 'You' : msg.model || 'Rhyno AI',
                    },
                    image: imageUri,
                    fileAsset: fileAssetForMessage,
                    audio: msg.audio_url || undefined,
                };
            });

            setMessages(formattedMessages);
            setInitialLoadComplete(true);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            Toast.show({ type: 'error', text1: 'خطا در دریافت پیام‌ها', text2: error.message });
            setInitialLoadComplete(true);
        } finally {
            setLoadingMessages(false);
        }
    }, [supabase]); // supabase

    const callChatAPI = useCallback(async (
        activeChatId: string | undefined,
        messageHistory: any[],
        userMessage: IMessage,
        modelOverride?: string
    ) => {
        console.log("--- [ChatLogic] 1. callChatAPI started. ---"); // 🪵 لاگ ۱

        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession) {
            console.error("--- [ChatLogic] ❗️ ERROR: Invalid session. ---");
            stopStreamingUpdates(true, "خطا: جلسه نامعتبر است."); // (از stopStreamingUpdates اصلاح شده استفاده کنید)
            return;
        }
        const accessToken = freshSession.access_token;

        if (!activeChatId || !user) {
            console.error("--- [ChatLogic] ❗️ ERROR: Chat ID or User missing. ---");
            stopStreamingUpdates(true, "خطا: ارتباط برقرار نشد.");
            return;
        }

        const modelForAPI = modelOverride || selectedModel;
        if (!modelForAPI) {
            console.error("--- [ChatLogic] ❗️ ERROR: Model not selected. ---");
            stopStreamingUpdates(true, "خطا: مدل انتخاب نشده است.");
            return;
        }

        console.log(`--- [ChatLogic] 2. Model selected: ${modelForAPI} ---`); // 🪵 لاگ ۲
        const chatSettingsForAPI = { model: modelForAPI };

        // --- ✅✅✅ منطق حیاتی ---
        // ۱. آدرس همیشه ثابت است (طبق خواسته شما)
        const endpoint = "/api/chat/openai";

        // ۲. تصمیم می‌گیریم که آیا منتظر JSON باشیم یا Stream
        const isStreaming = !JSON_MODELS.includes(modelForAPI);
        // --- ✅✅✅ ---

        console.log(`--- [ChatLogic] 3. Decision: isStreaming=${isStreaming}, endpoint=${endpoint} ---`); // 🪵 لاگ ۳

        const url = `${YOUR_BACKEND_URL}${endpoint}`;
        const body = JSON.stringify({
            chatSettings: chatSettingsForAPI,
            messages: messageHistory,
            enableWebSearch: true,
            chat_id: activeChatId,
            is_user_message_saved: false // (کلاینت موبایل خودش ذخیره می‌کند)
        });

        if (isStreaming) {

            // --- مسیر ۱: استریم متن (کد XHR فعلی شما) ---
            console.log(`--- [ChatLogic] 4. Executing STREAMING path (XHR) to: ${url} ---`); // 🪵 لاگ ۴ (استریم)
            accumulatedTextRef.current = '';
            startStreamingUpdates(); // (تابع شما)

            // (کد XHR شما که برای استریم عالی است)
            return new Promise<void>((resolve, reject) => {
                try {
                    const xhr = new XMLHttpRequest();
                    let seenBytes = 0;
                    xhr.open('POST', url);
                    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                    xhr.setRequestHeader('Content-Type', 'application/json');

                    xhr.onprogress = () => {
                        const newText = xhr.responseText.substring(seenBytes);
                        accumulatedTextRef.current += newText;
                        seenBytes = xhr.responseText.length;
                    };

                    xhr.onload = async () => {
                        try {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                console.log("--- [ChatLogic] 5. XHR Stream SUCCESS. ---");
                                const finalAssistantText = accumulatedTextRef.current;
                                stopStreamingUpdates(false, null);

                                if (finalAssistantText && activeChatId && user) {
                                    // (کد ذخیره پیام در دیتابیس)
                                    await supabase.from('messages').insert({
                                        chat_id: activeChatId,
                                        user_id: user.id,
                                        content: finalAssistantText.trim(),
                                        role: 'assistant',
                                        model: modelForAPI,
                                        sequence_number: messages.length,
                                        image_paths: []
                                    });
                                }
                                await supabase.from('chats').update({ updated_at: new Date().toISOString() })
                                    .eq('id', activeChatId)
                                    .eq('user_id', user.id);
                                resolve();

                            } else {
                                const errorText = xhr.responseText || 'خطای ناشناخته XHR';
                                console.error(`--- [ChatLogic] ❗️ 5. XHR Stream FAILED. Status: ${xhr.status} ---`, errorText);
                                accumulatedTextRef.current = `خطای سرور ${xhr.status}: ${errorText}`;
                                stopStreamingUpdates(true, null);
                                reject(new Error(`Server error: ${xhr.status}`));
                            }
                        } catch (onloadError: any) {
                            console.error("--- [ChatLogic] ❗️ ERROR inside XHR onload: ---", onloadError);
                            reject(onloadError);
                        }
                    };
                    xhr.onerror = () => {
                        console.error("--- [ChatLogic] ❗️ 5. XHR Network FAILED. ---");
                        accumulatedTextRef.current = `خطای شبکه در XHR.`;
                        stopStreamingUpdates(true, null);
                        reject(new Error("XHR Network Error"));
                    };
                    xhr.send(body);
                } catch (err: any) {
                    console.error("--- [ChatLogic] ❗️ 5. XHR Setup FAILED. ---", err);
                    accumulatedTextRef.current = `خطا در راه‌اندازی: ${err.message}`;
                    stopStreamingUpdates(true, null);
                    reject(err);
                }
            });

        } else {

            // --- مسیر ۲: دریافت JSON (برای TTS و DALL-E) ---
            console.log(`--- [ChatLogic] 4. Executing JSON path (fetch) to: ${url} ---`); // 🪵 لاگ ۴ (JSON)

            setMessages(prev => prev.map(msg =>
                msg._id === typingMessageIdRef.current ? { ...msg, text: 'در حال پردازش...' } : msg
            ));

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: body
                });

                console.log(`--- [ChatLogic] 5. JSON Response Status: ${response.status} ---`); // 🪵 لاگ ۵

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`--- [ChatLogic] ❗️ 6. JSON Response FAILED: ${errorText} ---`); // 🪵 لاگ ۶ (خطا)
                    throw new Error(`Server error ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("--- [ChatLogic] 6. JSON Response SUCCESS. Data:", data); // 🪵 لاگ ۶ (موفق)

                // (بک‌اند شما text و audioUrl را در آبجکت JSON برمی‌گرداند)
                const newText = data.text || 'پاسخ دریافت شد';
                const newImage = data.imageUrl || undefined;
                const newAudio = data.audioUrl || undefined; // ✅✅✅ این همان چیزی است که می‌خواهیم

                console.log(`--- [ChatLogic] 7. Parsed Data: newText=${newText}, newAudio=${newAudio} ---`); // 🪵 لاگ ۷

                // --- پیام "در حال تایپ" را با پیام نهایی جایگزین کن ---
                setMessages(prev =>
                    prev.map(msg =>
                        msg._id === typingMessageIdRef.current
                            ? {
                                ...msg,
                                text: newText,
                                image: newImage,
                                audio: newAudio, // ✅✅✅ اینجا برای رندر AudioPlayer ست می‌شود
                                isTyping: false,
                            }
                            : msg,
                    ),
                );

                // --- پیام جدید را در دیتابیس ذخیره کن ---
                console.log("--- [ChatLogic] 8. Saving assistant message to local DB... ---");
                await supabase
                    .from('messages')
                    .insert({
                        chat_id: activeChatId,
                        user_id: user.id,
                        content: newText,
                        role: 'assistant',
                        model: modelForAPI,
                        sequence_number: messages.length,
                        image_paths: newImage ? [newImage] : [],
                        audio_url: newAudio || null // ✅✅✅ ذخیره در دیتابیس
                    });
                console.log("--- [ChatLogic] 9. Message saved. Updating chat timestamp... ---");

                await supabase
                    .from('chats')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', activeChatId)
                    .eq('user_id', user.id);

                console.log("--- [ChatLogic] 10. TTS/JSON Flow COMPLETE. ---");

            } catch (error: any) {
                console.error(`--- [ChatLogic] ❗️ ERROR in JSON fetch block: ---`, error); // 🪵 لاگ خطا
                accumulatedTextRef.current = `خطا: ${error.message}`;
                stopStreamingUpdates(true, null); // نمایش خطا در UI
            } finally {
                // (مطمئن می‌شویم که isSending در هر صورت false می‌شود)
                if (typingMessageIdRef.current) {
                    stopStreamingUpdates(false, null);
                }
            }
        }
    }, [
        // (تمام وابستگی‌های قبلی را اینجا نگه دارید)
        user,
        selectedModel,
        supabase,
        chatSettings,
        messages,
        startStreamingUpdates,
        stopStreamingUpdates
    ]);

    const uploadFile = useCallback(async (asset: DocumentPickerAsset) => {
        if (!user) return;
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession) {
            setStagedFileState({ asset, status: 'error', error: 'جلسه نامعتبر' });
            return;
        }
        const accessToken = freshSession.access_token;

        try {
            const fileBlob = await (await fetch(asset.uri)).blob();
            const filePath = `${user.id}/${Date.now()}_${asset.name}`;
            const edgeFunctionUrl = `https://auisyflifvylebhgwcfe.functions.supabase.co/file-uploader`;

            const uploadResponse = await fetch(edgeFunctionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': asset.mimeType || 'application/octet-stream',
                    'X-File-Path': filePath,
                },
                body: fileBlob,
            });

            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadData.error || 'خطا در آپلود فانکشن');

            setStagedFileState({ asset, status: 'uploaded', uploadedPath: filePath });

        } catch (error: any) {
            console.error("File upload failed:", error);
            setStagedFileState({ asset, status: 'error', error: error.message });
        }
    }, [user, supabase]); // user, supabase

    const processUploadedFile = useCallback(async (
        activeChatId: string,
        fileState: StagedFileState
    ): Promise<string | null> => {
        if (!fileState || fileState.status !== 'uploaded' || !user || !workspaceId || !fileState.uploadedPath) {
            Alert.alert("خطا", "اطلاعات فایل برای پردازش نامعتبر است.");
            return null;
        }

        const { asset, uploadedPath } = fileState;
        const fileName = asset.name;

        setIsProcessingFile(true);
        Toast.show({ type: 'info', text1: '⏳ در حال پردازش فایل...', text2: fileName });

        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession) {
            Toast.show({ type: 'error', text1: 'خطا', text2: 'جلسه (session) نامعتبر است.' });
            setIsProcessingFile(false);
            return null;
        }
        const accessToken = freshSession.access_token;

        try {
            const { data: fileRow, error: insertError } = await supabase
                .from('files')
                .insert({
                    user_id: user.id,
                    name: fileName,
                    type: asset.mimeType || 'application/octet-stream',
                    size: asset.size || 0,
                    file_path: uploadedPath,
                    tokens: 0,
                    description: '',
                })
                .select('id')
                .single();

            if (insertError) throw new Error(`خطا در ذخیره دیتابیس: ${insertError.message}`);

            const file_id = fileRow.id;
            const formData = new FormData();
            formData.append('file_id', file_id);
            formData.append('embeddingsProvider', 'openai');

            const processResponse = await fetch(`${YOUR_BACKEND_URL}/api/retrieval/process`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData,
            });

            if (!processResponse.ok) {
                const err = await processResponse.json();
                throw new Error(`خطا در پردازش سرور: ${err.message || 'خطای ناشناخته'}`);
            }

            Toast.show({ type: 'success', text1: '✅ فایل با موفقیت پردازش شد', text2: fileName });
            return file_id;
        } catch (error: any) {
            console.error("File processing failed:", error);
            Toast.show({ type: 'error', text1: `❌ خطا در پردازش فایل: ${fileName}`, text2: error.message });
            return null;
        } finally {
            setIsProcessingFile(false);
        }
    }, [user, workspaceId, supabase]); // user, workspaceId, supabase

    //
    // 🛑 === ۴. USER ACTIONS (Send, Voice, Attachments) ===
    //

    // --- Send Message (The "Orchestrator") ---
    const handleSendMessage = (text: string, modelOverride?: string) => {
        if (isProcessingFile) { return; }
        const fileToProcess = stagedFileState?.status === 'uploaded' ? stagedFileState : null;
        if (!text.trim() && !stagedImage && !fileToProcess) return;
        if (!user || isSending) { return; }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        let userMessageText = text.trim();
        let fileAssetForMessage: DocumentPickerAsset | null = null;
        if (fileToProcess) {
            fileAssetForMessage = fileToProcess.asset;
            userMessageText = !userMessageText
                ? `فایل ضمیمه شد: ${fileToProcess.asset.name}`
                : `${text.trim()}\n\n(فایل ضمیمه: ${fileToProcess.asset.name})`;
        }

        const newMessage: IMessage & { fileAsset?: DocumentPickerAsset | null } = {
            _id: `user-${Date.now()}`,
            text: userMessageText,
            createdAt: new Date(),
            user: { _id: 1, name: displayName || 'You' },
            image: stagedImage || undefined,
            fileAsset: fileAssetForMessage,
        };

        const typingMessageId = `typing-${Date.now()}`;
        const typingMessage = createBotMessage(typingMessageId, '');
        typingMessageIdRef.current = typingMessageId;


        setIsSending(true);
        setMessages(previousMessages => [...previousMessages, newMessage, typingMessage]);
        setStagedImage(null);
        setStagedFileState(null);
        setEditText(null); // (اطمینان از بسته شدن حالت ادیت)
        setInputKey(`input-key-${Date.now()}`);

        // --- ASYNC FLOW ---
        (async () => {
            let activeChatId = currentChatId;
            let fileIdsForRetrieval: string[] = [];
            let contextText: string = "";
            const modelToUse = modelOverride || selectedModel;

            try {
                // --- A: Create Chat (if needed) ---
                if (!activeChatId && user) {
                    isCreatingChatRef.current = true;
                    let chatName = text.trim() || (fileToProcess && fileToProcess.asset.name) || (stagedImage && "چت تصویری") || "چت جدید";
                    chatName = chatName.split(' ').slice(0, 5).join(' ');

                    const chatDataForAPI = {
                        name: chatName,
                        workspace_id: workspaceId,
                        assistant_id: null,
                        model: modelToUse,
                        context_length: defaultChatSettings[selectedModel]?.MAX_CONTEXT_LENGTH ?? 4096,
                        temperature: defaultChatSettings[selectedModel]?.MAX_TEMPERATURE ?? 1,
                        embeddings_provider: workspaceEmbeddingsProvider || 'openai',
                        include_profile_context: true,
                        include_workspace_instructions: true,
                        prompt: modelPrompts[selectedModel] || "You are a helpful assistant.",
                    };

                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !session) throw new Error(sessionError?.message || "User session not found.");

                    const response = await fetch(`${YOUR_BACKEND_URL}/api/chat/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify(chatDataForAPI)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Failed to create chat (Status: ${response.status})`);
                    }

                    const newChat = await response.json();
                    activeChatId = newChat.id;
                    setCurrentChatId(activeChatId);
                }

                if (!activeChatId) throw new Error("Chat ID is still missing.");
                if (!user) throw new Error("User is not logged in.");

                const { error: tsError } = await supabase
                    .from('chats')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', activeChatId)
                    .eq('user_id', user.id);
                if (tsError) console.warn("[Optimistic] Timestamp update failed:", tsError.message);

                // --- B: Process File (if exists) ---
                if (fileToProcess) {
                    const newFileId = await processUploadedFile(activeChatId, fileToProcess);
                    if (newFileId) fileIdsForRetrieval.push(newFileId);
                }

                // --- C: Retrieve Context (if needed) ---
                if (fileIdsForRetrieval.length > 0) {
                    const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError || !freshSession) throw new Error("جلسه نامعتبر برای بازیابی");

                    const retrievalResponse = await fetch(`${YOUR_BACKEND_URL}/api/retrieval/retrieve`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${freshSession.access_token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userInput: userMessageText, fileIds: fileIdsForRetrieval })
                    });

                    if (retrievalResponse.ok) {
                        const retrievalData = await retrievalResponse.json();
                        if (retrievalData.fileItems && retrievalData.fileItems.length > 0) {
                            contextText = retrievalData.fileItems.map((item: any) => item.content).join("\n\n");
                        }
                    } else {
                        Toast.show({ type: 'error', text1: 'خطا در خواندن فایل', text2: 'ادامه چت بدون محتوای فایل...' });
                    }
                }

                // --- D: Build final API message history ---
                const historyForAPI = [...messages, newMessage]; // 'messages' dependency
                let backendMessages = historyForAPI
                    .filter(msg => !(msg.user._id === 2 && msg.text === '...'))
                    .sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
                    .map(msg => {
                        // ... (منطق ساخت آبجکت پیام برای API - کپی شده از فایل اصلی)
                        const msgWithFile = msg as IMessage & { fileAsset?: DocumentPickerAsset | null };
                        const content: any = [];
                        let textForAPI = msg.text.trim();

                        if (msgWithFile.fileAsset && textForAPI.startsWith('فایل ضمیمه شد:')) {
                            textForAPI = `User uploaded a file: ${msgWithFile.fileAsset.name}. Analyze it.`;
                        } else if (msgWithFile.fileAsset) {
                            textForAPI = `${textForAPI}\n\n[File Attached: ${msgWithFile.fileAsset.name}]`;
                        }

                        if (textForAPI) content.push({ type: 'text', text: textForAPI });
                        if (msg.image) {
                            content.push({ type: 'image_url', image_url: { url: msg.image } });
                        }

                        if (content.length === 0) content.push({ type: 'text', text: ' ' });
                        const role = msg.user._id === 1 ? 'user' : 'assistant';
                        if (content.length === 1 && content[0].type === 'text') { return { role: role, content: content[0].text }; }
                        return { role: role, content: content };
                    });

                // --- E: Inject Context ---
                if (contextText) {
                    const contextMessage = {
                        role: "system",
                        content: `Here is relevant context from user-uploaded files:\n\n${contextText}\n\nBased on this context, please answer the user's following message.`
                    };
                    backendMessages.splice(backendMessages.length - 1, 0, contextMessage);
                }

                // --- F: Call Chat API ---
                await callChatAPI(activeChatId, backendMessages, newMessage, modelToUse);

            } catch (error: any) {
                console.error("⛔️ ERROR IN SEND FLOW ⛔️", error);
                let errorMessage = error.message;
                if (error.message && error.message.includes("Network request failed")) {
                    errorMessage = "خطای شبکه. (احتمالاً CORS یا قطعی اینترنت)";
                }
                accumulatedTextRef.current = `خطا: ${errorMessage}`;
                stopStreamingUpdates(true, null);
            }
        })();
    }; // (وابستگی‌های این تابع بسیار زیاد است، useCallback نمی‌کنیم)

    // --- Voice Actions ---
    const handleVoiceSubmit = useCallback(async (uri: string, duration: number) => {
        if (!user) return;
        setIsTranscribing(true);

        try {
            const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !freshSession) throw new Error('جلسه نامعتبر');
            const accessToken = freshSession.access_token;

            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: `recording-${Date.now()}.m4a`,
                type: 'audio/m4a',
            } as any);

            const response = await fetch(`${YOUR_BACKEND_URL}/api/transcribe`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok || !result.text) throw new Error(result.message || 'خطا در رونویسی صدا');

            const transcribedText = result.text;
            if (selectedModel === 'gpt-4o-transcribe') {
                // ✅✅✅ ۳. 'audio: uri' را به پیام کاربر اضافه کنید
                const userAudioMessage: IMessage & { audio?: string } = {
                    _id: `user-audio-${Date.now()}`,
                    text: `(فایل صوتی: ${Math.round(duration / 1000)} ثانیه)`,
                    createdAt: new Date(),
                    user: { _id: 1, name: displayName || 'You' },
                    audio: uri, // ۲. ✅✅✅ خط حیاتی: URI فایل صوتی را اضافه کنید
                };
                const assistantTextMessage: IMessage = {
                    _id: `bot-transcribe-${Date.now()}`,
                    text: transcribedText,
                    createdAt: new Date(),
                    user: { _id: 2, name: 'Rhyno Transcribe' },
                };
                setMessages(prev => [...prev, userAudioMessage, assistantTextMessage]);
            } else {
                handleSendMessage(transcribedText);
            }
        } catch (error: any) {
            console.error("Voice transcription failed:", error);
            Alert.alert('خطا', 'خطا در رونویسی صدا: ' + error.message);
        } finally {
            setIsTranscribing(false);
        }
    }, [user, selectedModel, supabase, displayName, handleSendMessage]); // (handleSendMessage is stable)

    const {
        status: recordingStatus,
        handleToggleRecording,
    } = useVoiceRecorder({
        onRecordingComplete: handleVoiceSubmit,
    });
    const handleVoiceInputPress = handleToggleRecording; // (مستقیماً خود تابع را برمی‌گردانیم)

    // --- Attachment Actions ---
    const handleFileSelect = (asset: DocumentPickerAsset | null) => {
        if (asset) {
            setStagedFileState({ asset, status: 'uploading' });
        } else {
            setStagedFileState(null);
        }
    };
    const { handleAttachPress } = useAttachmentPicker({
        setStagedImage,
        setStagedFile: handleFileSelect
    });

    // --- Mic Permission ---
    const requestMicrophonePermission = useCallback(async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    { title: "اجازه دسترسی به میکروفون", message: "...", buttonPositive: "تایید", buttonNegative: "لغو" }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else {
            return true; // iOS permission handled by expo-av
        }
    }, []);

    const handleActivateRealtime = useCallback(async () => {
        const hasPermission = await requestMicrophonePermission();
        if (hasPermission) {
            setMicPermissionGranted(true);
        } else {
            Alert.alert("خطای دسترسی", "دسترسی به میکروفون برای چت صوتی ضروری است.");
            if (setSelectedModel) setSelectedModel("gpt-4o-mini");
        }
    }, [requestMicrophonePermission, setSelectedModel]); //...

    //
    // 🛑 === ۵. MESSAGE ACTIONS (Copy, Edit, Regenerate) ===
    //

    const handleCopyMessage = useCallback((text: string) => {
        Clipboard.setString(text);
        Toast.show({ type: 'success', text1: 'در کلیپ‌بورد کپی شد!' });
    }, []);

    const handleEditMessage = useCallback((msg: IMessage) => {
        setEditText(msg.text);
        setStagedImage(msg.image || null);
        // (Note: File editing not supported in this flow)
        setStagedFileState(null);
    }, []);

    const handleRegenerate = useCallback((messageIndex: number) => {
        const userMessage = messages[messageIndex - 1];
        if (!userMessage || userMessage.user._id !== 1) {
            Toast.show({ type: 'error', text1: 'پیام کاربر قبلی یافت نشد' });
            return;
        }

        // ۱. حذف پیام ربات (و پیام‌های بعد از آن)
        setMessages(prev => prev.slice(0, messageIndex));

        // ۲. ارسال مجدد پیام کاربر
        handleSendMessage(userMessage.text);

    }, [messages, handleSendMessage]); // 'messages', handleSendMessage

    //
    // 🛑 === ۶. EFFECTS ===
    //

    // --- Effect: Load chat on ID change ---
    useEffect(() => {
        const chatId = currentChatId;
        const createTimeout = (ms: number, message: string) => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

        const loadChat = async () => {
            if (isCreatingChatRef.current) {
                setLoadingMessages(false);
                setInitialLoadComplete(true);
                isCreatingChatRef.current = false;
                return;
            }

            if (user && chatId) {
                setLoadingMessages(true);
                setInitialLoadComplete(false);
                try {
                    const loadLogic = async () => {
                        const { data: chatData, error: chatError } = await supabase.from('chats').select('name').eq('id', chatId).single();
                        if (chatError) throw new Error(`خطای خواندن چت: ${chatError.message}`);
                        setCurrentChatName(chatData?.name || null);
                        await fetchMessages(chatId);
                    };
                    await Promise.race([loadLogic(), createTimeout(10000, 'بارگذاری بیش از ۱۰ ثانیه طول کشید.')]);
                } catch (error: any) {
                    Toast.show({ type: 'error', text1: 'خطا در بارگذاری اطلاعات چت', text2: error.message });
                } finally {
                    setLoadingMessages(false);
                    setInitialLoadComplete(true);
                }
            } else if (!chatId) {
                if (messages.length > 0) {
                    setMessages([]);
                    setCurrentChatName("چت جدید");
                }
                setLoadingMessages(false);
                setInitialLoadComplete(true);
            }
        };

        if (!isLoadingAuth) {
            loadChat();
        }
    }, [currentChatId, user, isLoadingAuth, fetchMessages]); // ...

    // --- Effect: Start file upload ---
    useEffect(() => {
        if (stagedFileState && stagedFileState.status === 'uploading') {
            uploadFile(stagedFileState.asset);
        }
    }, [stagedFileState, uploadFile]);

    // --- Effect: Request mic for realtime ---
    useEffect(() => {
        if (isRealtimeModel(selectedModel) && !micPermissionGranted) {
            handleActivateRealtime();
        } else if (!isRealtimeModel(selectedModel) && micPermissionGranted) {
            setMicPermissionGranted(false);
        }
    }, [selectedModel, handleActivateRealtime, micPermissionGranted, isRealtimeModel]);

    //
    // 🛑 === ۷. RETURN VALUES ===
    //
    return {
        // --- State & Data ---
        messages,
        stagedFileState,
        stagedImage,
        editText,
        isSending,
        loadingMessages,
        initialLoadComplete,
        isProcessingFile,
        isTranscribing,
        recordingStatus: recordingStatus,
        currentChatName,
        inputKey,
        firstName,
        isRealtime: isRealtimeModel(selectedModel) && micPermissionGranted,
        micPermissionGranted,
        lastUserMessageId,
        lastBotMessageId,
        session, // (برای VoiceUI)
        isLoadingAuth, // (برای لودینگ اولیه)
        user, // (برای چک کردن لاگین)

        // --- Action Handlers (برای UI) ---
        handleSendMessage,
        handleAttachPress,
        handleVoiceInputPress,
        handleCopyMessage,
        handleEditMessage,
        handleRegenerate,

        // --- Setters (برای ChatInput) ---
        onClearStagedImage: () => setStagedImage(null),
        onClearStagedFile: () => setStagedFileState(null),
        onEditTextDone: () => setEditText(null),
    };
};