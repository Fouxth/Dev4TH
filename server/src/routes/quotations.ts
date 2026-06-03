import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { sendEmail } from '../lib/email.js';

export const quotationsRouter = Router();

// Require admin or manager roles for quotation management
quotationsRouter.use(requireRole('admin', 'manager'));

// Helper to generate the next quotation number
async function nextNum() {
    const year = new Date().getFullYear();
    const prefix = `D4-QT-${year}`;

    const count = await prisma.quotation.count({
        where: { number: { startsWith: prefix } }
    });
        
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/quotations
quotationsRouter.get('/', async (_req, res) => {
    try {
        const quotes = await prisma.quotation.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(quotes);
    } catch (error) {
        console.error('Fetch quotations error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดใบเสนอราคาได้' });
    }
});

// GET /api/quotations/next-number
quotationsRouter.get('/next-number', async (_req, res) => {
    try {
        const num = await nextNum();
        res.json({ number: num });
    } catch (error) {
        console.error('Fetch next quotation number error:', error);
        res.status(500).json({ error: 'ไม่สามารถคำนวณหมายเลขใบเสนอราคาได้' });
    }
});

// GET /api/quotations/:id
quotationsRouter.get('/:id', async (req, res) => {
    try {
        const quote = await prisma.quotation.findUnique({
            where: { id: req.params.id }
        });
        if (!quote) {
            res.status(404).json({ error: 'ไม่พบใบเสนอราคานี้' });
            return;
        }
        res.json(quote);
    } catch (error) {
        console.error('Fetch quotation error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลใบเสนอราคาได้' });
    }
});

// POST /api/quotations
quotationsRouter.post('/', async (req, res) => {
    try {
        const data = req.body;
        
        if (!data.number) {
            data.number = await nextNum();
        }

        // Validate required fields
        if (!data.client || !data.email || !data.items || !data.total) {
            res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
            return;
        }

        // Convert date strings to Date objects
        const issueDate = data.issue ? new Date(data.issue) : new Date();
        const validUntilDate = data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const quote = await prisma.quotation.create({
            data: {
                number: data.number,
                client: data.client,
                email: data.email,
                phone: data.phone,
                addr: data.addr,
                project: data.project,
                issue: issueDate,
                validUntil: validUntilDate,
                items: data.items,
                discount: Number(data.discount) || 0,
                taxOn: Boolean(data.taxOn),
                vat: Number(data.vat) || 7,
                notes: data.notes,
                status: data.status || 'draft',
                total: Number(data.total),
                requestId: data.requestId || null
            }
        });

        // If this quote was created from a QuotationRequest, update its status
        if (data.requestId) {
            await prisma.quotationRequest.update({
                where: { id: data.requestId },
                data: { status: 'quoted' }
            });
        }

        res.json(quote);
    } catch (error: any) {
        console.error('Create quotation error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'เลขที่ใบเสนอราคานี้มีอยู่ในระบบแล้ว' });
        } else {
            res.status(500).json({ error: 'ไม่สามารถสร้างใบเสนอราคาได้' });
        }
    }
});

// PATCH /api/quotations/:id
quotationsRouter.patch('/:id', async (req, res) => {
    try {
        const data = req.body;
        const updateData: any = {};

        // Mapping updated fields
        if (data.number !== undefined) updateData.number = data.number;
        if (data.client !== undefined) updateData.client = data.client;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.addr !== undefined) updateData.addr = data.addr;
        if (data.project !== undefined) updateData.project = data.project;
        if (data.issue !== undefined) updateData.issue = new Date(data.issue);
        if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil);
        if (data.items !== undefined) updateData.items = data.items;
        if (data.discount !== undefined) updateData.discount = Number(data.discount);
        if (data.taxOn !== undefined) updateData.taxOn = Boolean(data.taxOn);
        if (data.vat !== undefined) updateData.vat = Number(data.vat);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.total !== undefined) updateData.total = Number(data.total);

        const quote = await prisma.quotation.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(quote);
    } catch (error) {
        console.error('Update quotation error:', error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตใบเสนอราคาได้' });
    }
});

// DELETE /api/quotations/:id
quotationsRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.quotation.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete quotation error:', error);
        res.status(500).json({ error: 'ไม่สามารถลบใบเสนอราคาได้' });
    }
});

// POST /api/quotations/:id/send-email
quotationsRouter.post('/:id/send-email', async (req, res) => {
    try {
        const { pdf } = req.body; // base64 string
        if (!pdf) {
            res.status(400).json({ error: 'ไม่พบไฟล์ PDF ในการจัดส่ง' });
            return;
        }

        const quote = await prisma.quotation.findUnique({
            where: { id: req.params.id }
        });

        if (!quote) {
            res.status(404).json({ error: 'ไม่พบใบเสนอราคา' });
            return;
        }

        // Clean base64 string if it contains data prefix
        const base64Data = pdf.replace(/^data:application\/pdf;base64,/, "");
        const pdfBuffer = Buffer.from(base64Data, 'base64');

        // Fetch company settings for branding
        const setting = await prisma.systemSetting.findUnique({
            where: { id: 'default' }
        });

        const coName = setting?.name || 'Dev4TH';

        const emailHtml = `
            <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; color: #333333; border: 1px solid #e5e7eb; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #ff6b35; padding-bottom: 16px;">
                    <h2 style="color: #ff6b35; margin: 0;">${coName}</h2>
                    <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">${setting?.tagline || ''}</p>
                </div>
                <h3 style="color: #111827; margin-top: 0;">เรียน คุณ ${quote.client},</h3>
                <p>ทางเราได้จัดทำใบเสนอราคา เลขที่ <strong>${quote.number}</strong> สำหรับโครงการ <strong>"${quote.project || 'ไม่ระบุชื่อโครงการ'}"</strong> เรียบร้อยแล้ว</p>
                <p>รายละเอียดตามเอกสารใบเสนอราคาแนบในอีเมลฉบับนี้</p>
                
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">เลขที่เอกสาร:</td>
                            <td style="font-weight: bold; text-align: right; padding: 4px 0;">${quote.number}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">วันที่ออก:</td>
                            <td style="text-align: right; padding: 4px 0;">${new Date(quote.issue).toLocaleDateString('th-TH')}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">ยอดรวมสุทธิ:</td>
                            <td style="font-weight: bold; color: #ff6b35; text-align: right; padding: 4px 0;">฿${quote.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>
                </div>

                <p>หากท่านมีข้อสงสัยเพิ่มเติมหรือต้องการอนุมัติโครงการ สามารถติดต่อกลับได้โดยตรงผ่านทางอีเมลหรือเบอร์โทรศัพท์ของบริษัท</p>
                <p style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
                    ขอแสดงความนับถือ,<br>
                    <strong>${coName}</strong><br>
                    อีเมล: ${setting?.email || ''}<br>
                    โทร: ${setting?.phone || ''}
                </p>
            </div>
        `;

        const sent = await sendEmail({
            to: quote.email,
            subject: `ใบเสนอราคา เลขที่ ${quote.number} - ${coName}`,
            html: emailHtml,
            attachments: [
                {
                    filename: `${quote.number}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        if (sent) {
            // Update quote status to 'sent'
            await prisma.quotation.update({
                where: { id: quote.id },
                data: { status: 'sent' }
            });
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'ไม่สามารถส่งอีเมลได้' });
        }
    } catch (error) {
        console.error('Send quotation email error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งอีเมล' });
    }
});
