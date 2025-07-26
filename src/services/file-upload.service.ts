import { Router, Request, Response } from 'express';
import multer from 'multer';
import imageUploadUtil from '../lib/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { isSuperAdmin } from '../middlewares/admin.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

router.post('/upload-record', authenticateToken, upload.single('file'), asyncHandler(async (req: MulterRequest, res: Response) => {
    try {

        if (!req.file) {
            return res.status(400).json({ success: false, message: "File is required" });
        }
        const id = (req as any).user.id;
        const user = await prisma.user.findFirst({
            where: { id },
            include: { medicalRecord: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }
        const returnUrl = uploadResult.secure_url;

        if (user.medicalRecord && user.medicalRecord.length > 0) {
            const existingRecord = user.medicalRecord[0];
            const updatedDocuments = [...existingRecord.documents, returnUrl];

            await prisma.medicalRecord.update({
                where: { userId: user.id },
                data: {
                    documents: updatedDocuments,
                },
            });
        } else {
            await prisma.medicalRecord.create({
                data: {
                    documents: [returnUrl],
                    history: [],
                    user: {
                        connect: { id: user.id },
                    },
                },
            });
        }
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

        await prisma.user.findFirst({
            where: { id },
        });

        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }

        const returnUrl = uploadResult.secure_url;

        await prisma.user.update({
            where: { id: id },
            data: {
                picture: returnUrl
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

router.post('/upload-admin-banner', authenticateToken, isSuperAdmin, upload.single('file'), asyncHandler(async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Banner image is required" });
        }
        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }

        const returnUrl = uploadResult.secure_url;

        await prisma.bannerImages.create({
            data: {
                imageUrl: returnUrl,
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
