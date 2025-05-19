import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";

export const isDoctor = asyncHandler(async (req: Request, res: Response, next) => {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
        return res.status(403).json({ message: "Access denied. Doctor role required." });
    }
    next();
});