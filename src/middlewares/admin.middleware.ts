import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

import { Request, Response } from "express";

export const isAdmin = asyncHandler(async (req: Request, res: Response, next) => {
    const userId = (req as any).user.id;

    const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    next();
});