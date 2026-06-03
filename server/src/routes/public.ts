import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const publicRouter = Router();

const allowedSystemTypes = new Set([
    'Custom — ปรึกษากับทีม',
    'Company Website',
    'Ecommerce',
    'Booking System',
    'Admin Dashboard',
    'Automation',
]);

const allowedBudgetRanges = new Set([
    '',
    'น้อยกว่า 30,000 บาท',
    '30,000 - 80,000 บาท',
    '80,000 - 150,000 บาท',
    '150,000 - 300,000 บาท',
    '300,000 - 500,000 บาท',
    'มากกว่า 500,000 บาท',
]);

function cleanString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// POST /api/public/quotation-requests
publicRouter.post('/quotation-requests', async (req, res) => {
    try {
        const fullName = cleanString(req.body.fullName);
        const company = cleanString(req.body.company);
        const email = cleanString(req.body.email).toLowerCase();
        const phone = cleanString(req.body.phone);
        const systemType = cleanString(req.body.systemType) || 'Custom — ปรึกษากับทีม';
        const budgetRange = cleanString(req.body.budgetRange);
        const scopeNotes = cleanString(req.body.scopeNotes);
        const pdpaConsent = req.body.pdpaConsent === true;
        const marketingConsent = req.body.marketingConsent === true;

        if (!fullName || !email || !phone) {
            res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และเบอร์โทร' });
            return;
        }

        if (!isValidEmail(email)) {
            res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });
            return;
        }

        if (!pdpaConsent) {
            res.status(400).json({ error: 'กรุณายินยอมการประมวลผลข้อมูลส่วนบุคคลเพื่อจัดทำใบเสนอราคา' });
            return;
        }

        if (!allowedSystemTypes.has(systemType)) {
            res.status(400).json({ error: 'ประเภทระบบที่สนใจไม่ถูกต้อง' });
            return;
        }

        if (!allowedBudgetRanges.has(budgetRange)) {
            res.status(400).json({ error: 'ช่วงงบประมาณไม่ถูกต้อง' });
            return;
        }

        const quotationRequest = await prisma.quotationRequest.create({
            data: {
                fullName,
                company: company || undefined,
                email,
                phone,
                systemType,
                budgetRange: budgetRange || undefined,
                scopeNotes,
                pdpaConsent,
                marketingConsent,
                metadata: {
                    userAgent: req.get('user-agent') || null,
                    ip: req.ip,
                },
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            message: 'ส่งคำขอใบเสนอราคาเรียบร้อยแล้ว',
            quotationRequest,
        });
    } catch (error) {
        console.error('Create quotation request error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งคำขอใบเสนอราคาได้' });
    }
});
