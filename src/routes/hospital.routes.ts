import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { name, address, contact, facilities, hours, location } = req.body;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const hospital = await prisma.hospital.create({
        data: {
            name,
            facilities: facilities || [],
            hours: hours || [],
            location: location || ''
        }
    });

    res.status(201).json({
        message: "Hospital created successfully",
        hospital
    });
}));

export default router;