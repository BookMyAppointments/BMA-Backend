import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.get('/get/:labId', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { labId } = req.params;

        const lab = await prisma.lab.findUnique({
            where: { id: labId },
            include: {
                location: true,
                hospital: {
                    include: {
                        location: true
                    }
                },
                tests: true,
                availability: true
            }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        res.status(200).json(lab);
    } catch (error) {
        console.error("Error finding lab:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));

router.post('/create', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { hospitalId } = req.query as { hospitalId?: string };
        const { uniqueCode } = req.query as { uniqueCode?: string };
        const {
            name,
            description,
            services,
            hours,
            location
        } = req.body;

        if (!name || !location) {
            return res.status(400).json({ message: "Name and location are required" });
        }

        if (!hospitalId && !uniqueCode) {
            return res.status(400).json({ message: "Either hospitalId or uniqueCode is required" });
        }

        const result = await prisma.$transaction(async (tx) => {
            if (hospitalId) {
                const hospital = await tx.hospital.findUnique({
                    where: { id: hospitalId }
                });

                if (!hospital) {
                    throw new Error("Hospital not found");
                }
            } else if (uniqueCode) {
                const link = await tx.link.findUnique({
                    where: { url: uniqueCode }
                });

                if (!link || !link.isActive) {
                    throw new Error("Invalid or inactive link");
                }

                await tx.link.update({
                    where: { url: uniqueCode },
                    data: { isActive: false }
                });
            }

            const newLocation = await tx.location.create({
                data: {
                    lat: Number(location.lat),
                    lng: Number(location.lng),
                    address: location.address
                }
            });

            const labData: any = {
                name,
                description,
                address: location.address,
                services: services || [],
                hours: hours || null,
                location: {
                    connect: { id: newLocation.id }
                }
            };

            if (hospitalId) {
                labData.hospital = {
                    connect: { id: hospitalId }
                };
            }

            return await tx.lab.create({
                data: labData
            });
        });

        res.status(201).json({
            message: "Lab created successfully",
            lab: result
        });

    } catch (error) {
        console.error("Error creating lab:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));

router.put('/update', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { labId } = req.query;
        const {
            name,
            description,
            services,
            hours,
            location
        } = req.body;

        if (!labId || typeof labId !== 'string') {
            return res.status(400).json({ message: "Lab ID is required in query parameters" });
        }

        const lab = await prisma.lab.findUnique({
            where: { id: labId },
            include: { location: true }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        if (location) {
            await prisma.location.update({
                where: { id: lab.locationId },
                data: {
                    lat: location.lat !== undefined ? Number(location.lat) : lab.location.lat,
                    lng: location.lng !== undefined ? Number(location.lng) : lab.location.lng,
                    address: location.address !== undefined ? location.address : lab.location.address
                }
            });
        }

        const updatedLab = await prisma.lab.update({
            where: { id: labId },
            data: {
                name: name !== undefined ? name : lab.name,
                description: description !== undefined ? description : lab.description,
                address: location.address !== undefined ? location.address : lab.address,
                services: services !== undefined ? services : lab.services,
                hours: hours !== undefined ? hours : lab.hours
            },
            include: {
                location: true,
                hospital: {
                    include: {
                        location: true
                    }
                },
                tests: true,
                availability: true
            }
        });

        res.status(200).json({
            message: "Lab updated successfully",
            lab: updatedLab
        });
    } catch (error) {
        console.error("Error updating lab:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}));

export default router;