import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './prisma.js';
import { sendPushToUser } from './pushNotifications.js';

let io: SocketIOServer | null = null;

function isNotificationPayload(data: unknown): data is {
    id?: string;
    type?: string;
    title: string;
    message: string;
    link?: string | null;
} {
    return Boolean(
        data &&
        typeof data === 'object' &&
        'title' in data &&
        'message' in data &&
        typeof (data as any).title === 'string' &&
        typeof (data as any).message === 'string'
    );
}

export function setIO(socketIO: SocketIOServer) {
    io = socketIO;
}

export function getIO(): SocketIOServer {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
}

/** Send a notification event to a specific user's room */
export function emitToUser(userId: string, event: string, data: unknown) {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
    if (event === 'new_notification' && isNotificationPayload(data)) {
        sendPushToUser(userId, {
            title: data.title,
            body: data.message,
            url: data.link ?? undefined,
            tag: `${data.type ?? 'notification'}:${data.link ?? data.id ?? Date.now()}`
        }).catch(error => console.error('Failed to send push notification:', error));
    }
}

/** Send notification to multiple users */
export function emitToUsers(userIds: string[], event: string, data: unknown) {
    if (io) {
        userIds.forEach(userId => {
            io!.to(`user:${userId}`).emit(event, data);
        });
    }
}

/** Broadcast to every connected client — used for entities visible to all authenticated users (tasks, projects, sprints, calendar events) */
export function emitToAll(event: string, data: unknown) {
    if (io) {
        io.emit(event, data);
    }
}

/** Create and send notification to user */
export async function createAndSendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: any
) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
                metadata
            }
        });

        // Send via WebSocket
        emitToUser(userId, 'new_notification', notification);

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

/** Create and send notifications to multiple users */
export async function createAndSendNotifications(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: any
) {
    try {
        const notifications = await Promise.all(
            userIds.map(userId =>
                prisma.notification.create({
                    data: { userId, type, title, message, link, metadata }
                })
            )
        );

        // Send via WebSocket
        notifications.forEach((notif, index) => {
            emitToUser(userIds[index], 'new_notification', notif);
        });

        return notifications;
    } catch (error) {
        console.error('Failed to create notifications:', error);
        return [];
    }
}
