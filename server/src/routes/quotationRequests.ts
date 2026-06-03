import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';

export const quotationRequestsRouter = Router();

quotationRequestsRouter.use(requireRole('admin', 'manager'));

// GET /api/quotation-requests
quotationRequestsRouter.get('/', async (_req, res) => {
    try {
        const requests = await prisma.quotationRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(requests);
    } catch (error) {
        console.error('Fetch quotation requests error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดคำขอใบเสนอราคาได้' });
    }
});

// PATCH /api/quotation-requests/:id/status
quotationRequestsRouter.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['new', 'reviewing', 'quoted', 'closed'];
        if (!allowedStatuses.includes(status)) {
            res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
            return;
        }

        const request = await prisma.quotationRequest.update({
            where: { id: req.params.id },
            data: { status },
        });
        res.json(request);
    } catch (error) {
        console.error('Update quotation request status error:', error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะได้' });
    }
});
