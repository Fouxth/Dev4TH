import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/lib/socketUrl';

export interface Notification {
    id: string;
    userId: string;
    type: 'task_assigned' | 'task_completed' | 'task_created' | 'comment' | 'mention' | 'due_soon' | 'chat' | 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    read: boolean;
    link?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface NotificationPrefs {
    taskAssigned: boolean;
    taskDue: boolean;
    mention: boolean;
    projectUpdate: boolean;
    chatMessages: boolean;
    weeklyReport: boolean;
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
    taskAssigned: true,
    taskDue: true,
    mention: true,
    projectUpdate: false,
    chatMessages: true,
    weeklyReport: true,
};

// Map notification type → pref key
const TYPE_TO_PREF: Record<string, keyof NotificationPrefs> = {
    task_assigned: 'taskAssigned',
    due_soon:      'taskDue',
    mention:       'mention',
    task_created:  'projectUpdate',
    task_completed:'projectUpdate',
    comment:       'projectUpdate',
    chat:          'chatMessages',
};

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

interface UseNotificationsOptions {
    token: string | null;
    prefs?: NotificationPrefs;
    onNotification?: (notification: Notification) => void;
}

// Create notification sound using Web Audio API
const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Create a simple pleasant notification tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Two-tone notification (E5 -> G#5)
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(830.61, audioContext.currentTime + 0.1);
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Clean up
        setTimeout(() => audioContext.close(), 400);
    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
};

export function useNotifications({ token, prefs, onNotification }: UseNotificationsOptions) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>(
        typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'default'
    );
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Keep the latest prefs/callback available to the socket handler without
    // having to reconnect the socket every render (the effect below only
    // depends on `token`).
    const latestRef = useRef({ prefs, onNotification });
    useEffect(() => { latestRef.current = { prefs, onNotification }; });

    // Fetch notifications from REST API
    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, [token]);

    // Connect socket
    useEffect(() => {
        if (!token) return;

        const socketUrl = getSocketUrl();
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            path: '/socket.io'
        });

        socket.on('connect', () => {
            // connected
        });

        socket.on('new_notification', (notif: Notification) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Check user prefs (read fresh via ref — this effect doesn't re-run on prefs/callback changes)
            const { prefs: currentPrefs, onNotification: currentOnNotification } = latestRef.current;
            const prefKey = TYPE_TO_PREF[notif.type];
            const allowed = !prefKey || !currentPrefs || currentPrefs[prefKey] !== false;

            if (allowed) {
                playNotificationSound();
                if (currentOnNotification) {
                    currentOnNotification(notif);
                }
            }
        });

        socket.on('disconnect', () => {
            // disconnected
        });

        socketRef.current = socket;

        // Initial load
        fetchNotifications();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, fetchNotifications]);

    const getServiceWorkerRegistration = useCallback(async () => {
        if (!('serviceWorker' in navigator)) return null;
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) return existing;
        return navigator.serviceWorker.register('/sw.js');
    }, []);

    const refreshPushStatus = useCallback(async () => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setPushSupported(supported);
        if (!supported) return;

        setPushPermission(window.Notification.permission);
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setPushSubscribed(Boolean(subscription));
    }, []);

    useEffect(() => {
        refreshPushStatus().catch(() => {});
    }, [refreshPushStatus]);

    const enablePushNotifications = useCallback(async () => {
        if (!token) return false;
        setPushLoading(true);
        try {
            const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
            setPushSupported(supported);
            if (!supported) return false;

            const permission = await window.Notification.requestPermission();
            setPushPermission(permission);
            if (permission !== 'granted') return false;

            const keyRes = await fetch('/api/notifications/push/public-key', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!keyRes.ok) return false;
            const { publicKey } = await keyRes.json();

            const registration = await getServiceWorkerRegistration();
            if (!registration) return false;

            const existing = await registration.pushManager.getSubscription();
            const subscription = existing ?? await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            const res = await fetch('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(subscription.toJSON())
            });
            const ok = res.ok;
            setPushSubscribed(ok);
            return ok;
        } catch (error) {
            console.error('Failed to enable push notifications:', error);
            return false;
        } finally {
            setPushLoading(false);
        }
    }, [getServiceWorkerRegistration, token]);

    const disablePushNotifications = useCallback(async () => {
        if (!token) return false;
        setPushLoading(true);
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const subscription = await registration?.pushManager.getSubscription();
            if (!subscription) {
                setPushSubscribed(false);
                return true;
            }

            await fetch('/api/notifications/push/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ endpoint: subscription.endpoint })
            });
            await subscription.unsubscribe();
            setPushSubscribed(false);
            return true;
        } catch (error) {
            console.error('Failed to disable push notifications:', error);
            return false;
        } finally {
            setPushLoading(false);
        }
    }, [token]);

    // Mark single as read
    const markAsRead = useCallback(async (id: string) => {
        if (!token) return;
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    }, [token]);

    // Mark all as read
    const markAllRead = useCallback(async () => {
        if (!token) return;
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }, [token]);

    // Delete notification
    const deleteNotification = useCallback(async (id: string) => {
        if (!token) return;
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => {
                const notif = prev.find(n => n.id === id);
                if (notif && !notif.read) {
                    setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n.id !== id);
            });
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    }, [token]);

    return {
        notifications,
        unreadCount,
        pushSupported,
        pushPermission,
        pushSubscribed,
        pushLoading,
        enablePushNotifications,
        disablePushNotifications,
        refreshPushStatus,
        markAsRead,
        markAllRead,
        deleteNotification,
        refetch: fetchNotifications
    };
}
