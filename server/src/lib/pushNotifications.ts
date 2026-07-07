import webPush from 'web-push';
import { prisma } from './prisma.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@dxv4th.local';

const pushEnabled = Boolean(vapidPublicKey && vapidPrivateKey);

if (pushEnabled) {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function getVapidPublicKey() {
    return vapidPublicKey;
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}

function normalizeUrl(link?: string | null) {
    if (!link) return '/';
    if (link.startsWith('/')) return link;
    return `/?notification=${encodeURIComponent(link)}`;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
    if (!pushEnabled) return;

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(subscriptions.map(async (subscription: any) => {
        try {
            await webPush.sendNotification(
                {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                },
                JSON.stringify({
                    title: payload.title,
                    body: payload.body,
                    url: normalizeUrl(payload.url),
                    tag: payload.tag
                })
            );
        } catch (error: any) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => {});
                return;
            }
            console.error('Failed to send push notification:', error);
        }
    }));
}

export async function sendPushToUsers(userIds: string[], payloadForUser: (userId: string) => PushPayload) {
    await Promise.all(userIds.map(userId => sendPushToUser(userId, payloadForUser(userId))));
}
