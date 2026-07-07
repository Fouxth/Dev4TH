import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { emitToAll } from '../lib/socket.js';

export const eventsRouter = Router();

// GET /api/events
eventsRouter.get('/', async (_req, res) => {
    try {
        const events = await prisma.calendarEvent.findMany({
            orderBy: { startTime: 'asc' }
        });
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST /api/events
eventsRouter.post('/', async (req, res) => {
    try {
        const { title, description, startTime, endTime, type, userId, attendees, projectId, taskId, color } = req.body;
        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Event title is required' });
            return;
        }
        if (!startTime || !endTime) {
            res.status(400).json({ error: 'Start and end time are required' });
            return;
        }
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const allowedTypes = ['task', 'meeting', 'deadline', 'reminder'];
        const event = await prisma.calendarEvent.create({
            data: {
                title: title.trim(),
                description: description || undefined,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: allowedTypes.includes(type) ? type : 'task',
                userId,
                attendees: attendees && Array.isArray(attendees) ? attendees : [userId],
                projectId: projectId || undefined,
                taskId: taskId || undefined,
                color: color || undefined,
            }
        });

        // Send notifications to all attendees
        const attendeeIds = attendees && Array.isArray(attendees) ? attendees : [userId];
        const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        
        // Create notifications for all attendees
        const notificationPromises = attendeeIds.map(attendeeId => 
            prisma.notification.create({
                data: {
                    userId: attendeeId,
                    type: 'event_created',
                    title: `📅 ${type === 'meeting' ? 'ประชุม' : type === 'deadline' ? 'กำหนดส่ง' : type === 'reminder' ? 'เตือนความจำ' : 'งาน'}ใหม่`,
                    message: `${creator?.name || 'มีคน'}เพิ่มคุณในกิจกรรม "${title}"`,
                    link: `/calendar`,
                    metadata: { eventId: event.id, type }
                }
            })
        );
        
        await Promise.all(notificationPromises);

        emitToAll('event:created', event);
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// PATCH /api/events/:id - Update event
eventsRouter.patch('/:id', async (req, res) => {
    try {
        const { title, description, startTime, endTime, type, color, attendees } = req.body;
        
        // Get current event to compare attendees
        const currentEvent = await prisma.calendarEvent.findUnique({
            where: { id: req.params.id },
            include: { user: { select: { name: true } } }
        });

        const event = await prisma.calendarEvent.update({
            where: { id: req.params.id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(startTime !== undefined && { startTime: new Date(startTime) }),
                ...(endTime !== undefined && { endTime: new Date(endTime) }),
                ...(type !== undefined && { type }),
                ...(color !== undefined && { color }),
                ...(attendees !== undefined && { attendees }),
            }
        });

        // If attendees changed, send notifications to new attendees
        if (attendees && currentEvent) {
            const newAttendees = attendees.filter((id: string) => !currentEvent.attendees.includes(id));
            if (newAttendees.length > 0) {
                const notificationPromises = newAttendees.map((attendeeId: string) => 
                    prisma.notification.create({
                        data: {
                            userId: attendeeId,
                            type: 'event_updated',
                            title: `📅 ถูกเพิ่มในกิจกรรม`,
                            message: `${currentEvent.user.name}เพิ่มคุณในกิจกรรม "${event.title}"`,
                            link: `/calendar`,
                            metadata: { eventId: event.id }
                        }
                    })
                );
                await Promise.all(notificationPromises);
            }
        }

        emitToAll('event:updated', event);
        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// DELETE /api/events/:id
eventsRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.calendarEvent.delete({
            where: { id: req.params.id }
        });
        emitToAll('event:deleted', { id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
