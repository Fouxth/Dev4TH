import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';

export const publicWorksRouter = Router();

// Require admin or manager roles for managing public portfolio works
publicWorksRouter.use(requireRole('admin', 'manager'));

// GET /api/public-works
publicWorksRouter.get('/', async (_req, res) => {
    try {
        const works = await prisma.publicWork.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(works);
    } catch (error) {
        console.error('Fetch admin public works error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดรายการผลงานได้' });
    }
});

// POST /api/public-works
publicWorksRouter.post('/', async (req, res) => {
    try {
        const { name, type, industry, stack, tags, text, featured, githubUrl } = req.body;
        
        if (!name || !type || !industry || !stack || !text) {
            res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
            return;
        }

        const work = await prisma.publicWork.create({
            data: {
                name,
                type,
                industry,
                stack,
                tags: Array.isArray(tags) ? tags : [],
                text,
                featured: Boolean(featured),
                githubUrl: githubUrl || null
            }
        });

        res.status(201).json(work);
    } catch (error) {
        console.error('Create public work error:', error);
        res.status(500).json({ error: 'ไม่สามารถเพิ่มผลงานใหม่ได้' });
    }
});

// PUT /api/public-works/:id
publicWorksRouter.put('/:id', async (req, res) => {
    try {
        const { name, type, industry, stack, tags, text, featured, githubUrl } = req.body;
        const { id } = req.params;

        if (!name || !type || !industry || !stack || !text) {
            res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
            return;
        }

        const work = await prisma.publicWork.update({
            where: { id },
            data: {
                name,
                type,
                industry,
                stack,
                tags: Array.isArray(tags) ? tags : [],
                text,
                featured: Boolean(featured),
                githubUrl: githubUrl || null
            }
        });

        res.json(work);
    } catch (error) {
        console.error('Update public work error:', error);
        res.status(500).json({ error: 'ไม่สามารถแก้ไขข้อมูลผลงานได้' });
    }
});

// DELETE /api/public-works/:id
publicWorksRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.publicWork.delete({
            where: { id }
        });

        res.json({ message: 'ลบผลงานสำเร็จ' });
    } catch (error) {
        console.error('Delete public work error:', error);
        res.status(500).json({ error: 'ไม่สามารถลบผลงานได้' });
    }
});
