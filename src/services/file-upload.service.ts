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

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const uploadResult = await imageUploadUtil.imageUploadUtil(req.file.buffer, req.file.mimetype);

        if (!uploadResult) {
            return res.status(500).json({ success: false, message: "File upload failed" });
        }        const returnUrl = uploadResult.secure_url;

        // Check if user already has a medical record
        if (user.medicalRecord && user.medicalRecord.length > 0) {
            // Update existing medical record
            const existingRecord = user.medicalRecord[0];
            const updatedDocuments = [...existingRecord.documents, returnUrl];
            
            await prisma.medicalRecord.update({
                where: { userId: user.id },
                data: {
                    documents: updatedDocuments,
                },
            });
        } else {
            // Create new medical record
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
console.log("hello from api");

        const id = (req as any).user.id;
console.log(id);

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
        console.log("url is ",returnUrl);

        await prisma.profile.upsert({
  where: { userId: id },
  update: { picture: returnUrl },
  create: {
    picture: returnUrl,
    user:{
        connect:{
        id
        }
    }
  },
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
