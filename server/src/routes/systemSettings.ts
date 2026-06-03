import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';

export const systemSettingsRouter = Router();

// Only admin and manager can modify system settings, but developers/others can view
systemSettingsRouter.use(requireRole('admin', 'manager', 'developer'));

// GET /api/system-settings
systemSettingsRouter.get('/', async (_req, res) => {
    try {
        let setting = await prisma.systemSetting.findUnique({
            where: { id: 'default' }
        });

        if (!setting) {
            // Seed defaults if it doesn't exist
            setting = await prisma.systemSetting.create({
                data: {
                    id: 'default',
                    name: 'Dev4TH ดีไซน์ สตูดิโอ',
                    tagline: 'บริการออกแบบมืออาชีพ',
                    website: 'https://devath.io',
                    email: 'hello@devath.io',
                    phone: '02-xxx-xxxx',
                    addr: 'กรุงเทพมหานคร',
                    bank: 'ธนาคารกสิกรไทย',
                    accNum: '',
                    accName: '',
                    currency: 'THB',
                    vat: 7,
                    validity: 30,
                    dueDays: 14,
                    terms: 'กรุณาชำระเงินภายใน 30 วัน หลังจากได้รับใบแจ้งหนี้\nสอบถามข้อมูลเพิ่มเติม: hello@devath.io'
                }
            });
        }

        res.json(setting);
    } catch (error) {
        console.error('Fetch system settings error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดการตั้งค่าได้' });
    }
});

// PUT /api/system-settings
systemSettingsRouter.put('/', requireRole('admin', 'manager'), async (req, res) => {
    try {
        const data = req.body;
        
        // Remove id and timestamps from input if present
        const { id, createdAt, updatedAt, ...updatableData } = data;

        const updated = await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: updatableData,
            create: {
                id: 'default',
                ...updatableData
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update system settings error:', error);
        res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
    }
});
