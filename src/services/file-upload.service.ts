import { Router, Request, Response } from 'express';
import multer from 'multer';
import imageUploadUtil from '../lib/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

router.post('/upload', authenticateToken, upload.single('file'), asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "File is required" });
        }

        const id = (req as any).user.id;

        const user = await prisma.user.findFirst(
            {
                where: { id },
                include: { medicalRecord: true }
            },
        );

        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }

        const returnUrl = uploadResult.secure_url;

        const documents = user?.medicalRecord?.documents || [];
        documents.push(returnUrl);

        await prisma.user.update({
            where: { id },
            data: {
                medicalRecord: {
                    create: {
                        documents: documents,
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            url: returnUrl,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Upload failed' });
    }
}));

router.post('/upload-picture', authenticateToken, upload.single('file'), asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Picture is required" });
        }

        const id = (req as any).user.id;

        const user = await prisma.user.findFirst(
            {
                where: { id },
            },
        );

        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }

        const returnUrl = uploadResult.secure_url;

        await prisma.profile.update({
            where: { id },
            data: {
                picture: returnUrl,
            }
        });

        res.status(201).json({
            success: true,
            url: returnUrl,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Upload failed' });
    }
}));

export default router;
