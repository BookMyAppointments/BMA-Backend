import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isSuperAdmin } from '../middlewares/admin.middleware';

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

//* Register a lab (standalone, or attached to a hospital). Any signed-in user
//* can submit -- the real gate is super admin approval, not the caller's
//* current role. Stays invisible to patients (status: PENDING) until then.
router.post('/create', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { hospitalId } = req.query as { hospitalId?: string };
        const { uniqueCode } = req.query as { uniqueCode?: string };
        const userId = (req as any).user.id;
        const userEmail = (req as any).user.email;
        const userRole = (req as any).user.role;
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

        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });

            if (!hospital) {
                return res.status(404).json({ message: "Hospital not found" });
            }

            // Only that hospital's own admin (or a super admin) may attach a lab to it.
            if (userRole !== 'SUPERADMIN' && hospital.adminId !== userId) {
                return res.status(403).json({ message: "You do not administer this hospital." });
            }
        }

        // The old invite-link flow still works if a code was issued, but is no
        // longer required -- approval by a super admin is the real gate now.
        if (uniqueCode) {
            const link = await prisma.link.findUnique({ where: { url: uniqueCode } });
            if (!link || !link.isActive) {
                return res.status(400).json({ message: "Invalid or inactive link" });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
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
                // Stays invisible to patients until a super admin approves
                // the request created below.
                status: 'PENDING',
                location: {
                    connect: { id: newLocation.id }
                }
            };

            if (hospitalId) {
                labData.hospital = {
                    connect: { id: hospitalId }
                };
            }

            const lab = await tx.lab.create({ data: labData });

            await tx.request.create({
                data: {
                    userEmail,
                    lab: { connect: { id: lab.id } },
                    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    user: { connect: { id: userId } }
                }
            });

            if (uniqueCode) {
                await tx.link.update({
                    where: { url: uniqueCode },
                    data: { isActive: false }
                });
            }

            return lab;
        });

        res.status(201).json({
            message: "Lab registered. A super admin will review it before it goes live.",
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

//* Bookings for a lab (staff only -- includes patient contact details).
router.get('/:labId/appointments', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { labId } = req.params;

        const appointments = await prisma.appointment.findMany({
            where: { labId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, picture: true }
                },
                test: true
            },
            orderBy: { scheduledAt: 'desc' }
        });

        res.status(200).json({ appointments });
    } catch (error) {
        console.error("Error fetching lab appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

//* Full roster for the super admin console, every status included.
router.get('/admin/all', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const labs = await prisma.lab.findMany({
            include: {
                location: true,
                hospital: { select: { id: true, name: true } },
                admin: { select: { id: true, name: true, email: true, phone: true } },
                _count: { select: { tests: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(labs);
    } catch (error) {
        console.error("Error listing labs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

//* Suspend or reactivate a lab, hiding/restoring it for patients.
router.put('/suspend', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        const { status } = req.body as { status?: 'ACTIVE' | 'SUSPENDED' };

        if (!id) {
            return res.status(400).json({ message: "Lab ID is required" });
        }

        if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
            return res.status(400).json({ message: "status must be ACTIVE or SUSPENDED" });
        }

        const lab = await prisma.lab.update({
            where: { id: id as string },
            data: { status }
        });

        res.status(200).json({ message: `Lab ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'}`, lab });
    } catch (error) {
        console.error("Error updating lab status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

export default router;