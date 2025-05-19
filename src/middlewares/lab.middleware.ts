import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const isLab = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include : {
                appointments : {
                    include : {
                        lab : {
                            select : {
                                id : true
                            }
                        }
                    }
                }
            }
        });

        const lab = await prisma.lab.findFirst({
            where: { id : user?.appointments[0]?.lab?.id },
            select: { id: true }
        });

        if (!lab) {
            res.status(403).json({
                message: "Access denied. Lab privileges required."
            });
            return; // Explicit return to stop execution
        }

        (req as any).lab = { id: lab.id };

        next();
    } catch (error) {
        console.error('Lab verification error:', error);
        res.status(500).json({
            message: "An error occurred while verifying lab privileges"
        });
    }
};