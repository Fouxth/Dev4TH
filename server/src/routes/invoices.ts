import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { sendEmail } from '../lib/email.js';

export const invoicesRouter = Router();

// Require admin or manager roles for invoice management
invoicesRouter.use(requireRole('admin', 'manager'));

// Helper to generate the next invoice number
async function nextNum() {
    const year = new Date().getFullYear();
    const prefix = `D4-INV-${year}`;

    const count = await prisma.invoice.count({
        where: { number: { startsWith: prefix } }
    });
        
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/invoices
invoicesRouter.get('/', async (_req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        console.error('Fetch invoices error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดใบแจ้งหนี้ได้' });
    }
});

// GET /api/invoices/next-number
invoicesRouter.get('/next-number', async (_req, res) => {
    try {
        const num = await nextNum();
        res.json({ number: num });
    } catch (error) {
        console.error('Fetch next invoice number error:', error);
        res.status(500).json({ error: 'ไม่สามารถคำนวณหมายเลขใบแจ้งหนี้ได้' });
    }
});

// GET /api/invoices/:id
invoicesRouter.get('/:id', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id }
        });
        if (!invoice) {
            res.status(404).json({ error: 'ไม่พบใบแจ้งหนี้นี้' });
            return;
        }
        res.json(invoice);
    } catch (error) {
        console.error('Fetch invoice error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้' });
    }
});

// POST /api/invoices
invoicesRouter.post('/', async (req, res) => {
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
        const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const invoice = await prisma.invoice.create({
            data: {
                number: data.number,
                client: data.client,
                email: data.email,
                phone: data.phone,
                addr: data.addr,
                project: data.project,
                issue: issueDate,
                dueDate: dueDate,
                items: data.items,
                discount: Number(data.discount) || 0,
                taxOn: Boolean(data.taxOn),
                vat: Number(data.vat) || 7,
                notes: data.notes,
                status: data.status || 'unpaid',
                total: Number(data.total),
                quoteId: data.quoteId || null
            }
        });

        res.json(invoice);
    } catch (error: any) {
        console.error('Create invoice error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'เลขที่ใบแจ้งหนี้นี้มีอยู่ในระบบแล้ว' });
        } else {
            res.status(500).json({ error: 'ไม่สามารถสร้างใบแจ้งหนี้ได้' });
        }
    }
});

// PATCH /api/invoices/:id
invoicesRouter.patch('/:id', async (req, res) => {
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
        if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
        if (data.items !== undefined) updateData.items = data.items;
        if (data.discount !== undefined) updateData.discount = Number(data.discount);
        if (data.taxOn !== undefined) updateData.taxOn = Boolean(data.taxOn);
        if (data.vat !== undefined) updateData.vat = Number(data.vat);
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.total !== undefined) updateData.total = Number(data.total);

        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตใบแจ้งหนี้ได้' });
    }
});

// DELETE /api/invoices/:id
invoicesRouter.delete('/:id', async (req, res) => {
    try {
        await prisma.invoice.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: 'ไม่สามารถลบใบแจ้งหนี้ได้' });
    }
});

// POST /api/invoices/:id/send-email
invoicesRouter.post('/:id/send-email', async (req, res) => {
    try {
        const { pdf } = req.body; // base64 string
        if (!pdf) {
            res.status(400).json({ error: 'ไม่พบไฟล์ PDF ในการจัดส่ง' });
            return;
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id }
        });

        if (!invoice) {
            res.status(404).json({ error: 'ไม่พบใบแจ้งหนี้' });
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
                <h3 style="color: #111827; margin-top: 0;">เรียน คุณ ${invoice.client},</h3>
                <p>ทางเราได้จัดส่งใบแจ้งหนี้ เลขที่ <strong>${invoice.number}</strong> สำหรับโครงการ <strong>"${invoice.project || 'ไม่ระบุชื่อโครงการ'}"</strong> เรียบร้อยแล้ว</p>
                <p>รายละเอียดการชำระเงินและกำหนดการแนบอยู่ในเอกสารใบแจ้งหนี้แนบในอีเมลฉบับนี้</p>
                
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">เลขที่เอกสาร:</td>
                            <td style="font-weight: bold; text-align: right; padding: 4px 0;">${invoice.number}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">วันออกเอกสาร:</td>
                            <td style="text-align: right; padding: 4px 0;">${new Date(invoice.issue).toLocaleDateString('th-TH')}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0;">วันครบกำหนดชำระ:</td>
                            <td style="font-weight: bold; color: #ef4444; text-align: right; padding: 4px 0;">${new Date(invoice.dueDate).toLocaleDateString('th-TH')}</td>
                        </tr>
                        <tr>
                            <td style="color: #6b7280; padding: 4px 0; border-top: 1px solid #e5e7eb;">ยอดชำระสุทธิ:</td>
                            <td style="font-weight: bold; color: #ff6b35; text-align: right; padding: 4px 0; border-top: 1px solid #e5e7eb;">฿${invoice.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>
                </div>

                ${setting?.bank ? `
                <div style="border: 1px dashed #ff6b35; padding: 16px; border-radius: 8px; margin: 20px 0; background: #fffaf7;">
                    <h4 style="color: #ff6b35; margin: 0 0 8px 0;">ข้อมูลการชำระเงิน</h4>
                    <p style="font-size: 14px; margin: 4px 0;"><strong>ธนาคาร:</strong> ${setting.bank}</p>
                    <p style="font-size: 14px; margin: 4px 0;"><strong>เลขที่บัญชี:</strong> ${setting.accNum}</p>
                    <p style="font-size: 14px; margin: 4px 0;"><strong>ชื่อบัญชี:</strong> ${setting.accName}</p>
                </div>
                ` : ''}

                <p>หากชำระเงินเรียบร้อยแล้ว กรุณาส่งหลักฐานการโอนเงินกลับมาทางอีเมลนี้เพื่อทำใบเสร็จรับเงินต่อไป</p>
                <p style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280;">
                    ขอแสดงความนับถือ,<br>
                    <strong>${coName}</strong><br>
                    อีเมล: ${setting?.email || ''}<br>
                    โทร: ${setting?.phone || ''}
                </p>
            </div>
        `;

        const sent = await sendEmail({
            to: invoice.email,
            subject: `ใบแจ้งหนี้ เลขที่ ${invoice.number} - ${coName}`,
            html: emailHtml,
            attachments: [
                {
                    filename: `${invoice.number}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        if (sent) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'ไม่สามารถส่งอีเมลได้' });
        }
    } catch (error) {
        console.error('Send invoice email error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งอีเมล' });
    }
});
