import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin, isSuperAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.get('/get', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { department, service } = req.query;

        // Only hospitals a super admin has approved are visible to patients.
        const where: any = { status: 'ACTIVE' };

        if (department) {
            where.departments = {
                has: department as string
            };
        }

        if (service) {
            where.services = {
                has: service as string
            };
        }

        const hospitals = await prisma.hospital.findMany({
            where,
            include: {
                location: true
            }
        });

        res.status(200).json(hospitals);
    } catch (error) {
        console.error("Error fetching hospitals:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const hospital = await prisma.hospital.findFirst({
            where: { id, status: 'ACTIVE' },
            include: {
                location: true,
                labs: {
                    include: {
                        location: true
                    }
                },
                doctors: {
                    include: {
                        availability: true,
                        reviews: true
                    }
                }
            }
        });

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        res.status(200).json(hospital);
    } catch (error) {
        console.error("Error fetching hospital:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

//* Register a hospital. Any signed-in user can submit -- the real gate is
//* super admin approval, not the caller's current role. Stays invisible to
//* patients (status: PENDING) until then.
router.post('/create', authenticateToken, asyncHandler(async (req: Request, res: Response) => {

    const { uniqueCode } = req.query;
    // const uniqueLink = `${process.env.CORS_ORIGIN}/admin/hospital/create?uniqueCode=${uniqueCode}`;

    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email

    try {
        const {
            name,
            departments,
            facilities,
            services,
            hours,
            location
        } = req.body;

        if (!name || !location) {
            return res.status(400).json({ message: "Name and location are required" });
        }

        if (!location.lat || !location.lng || !location.address) {
            return res.status(400).json({ message: "Location details are required" });
        }

        if (!Array.isArray(departments) || !Array.isArray(facilities) || !Array.isArray(services)) {
            return res.status(400).json({ message: "Departments, facilities, and services should be arrays" });
        }

        // The old invite-link flow still works if a code was issued, but is no
        // longer required -- approval by a super admin is the real gate now.
        if (uniqueCode) {
            const link = await prisma.link.findUnique({ where: { url: uniqueCode as string } });
            if (!link || !link.isActive) {
                return res.status(400).json({ message: "Invalid or inactive link" });
            }
        }

        const newLocation = await prisma.location.create({
            data: {
                lat: location.lat,
                lng: location.lng,
                address: location.address
            }
        });

        await prisma.$transaction(async (tx) => {
            const hospital = await tx.hospital.create({
                data: {
                    name,
                    departments: departments,
                    facilities: facilities,
                    services: services,
                    hours: hours,
                    address: location.address,
                    // Stays invisible to patients until a super admin approves
                    // the admin request created below.
                    status: 'PENDING',
                    location: {
                        connect: { id: newLocation.id }
                    },
                    // admin: {
                    //     connect: { id: userId }
                    // }
                }
            });

            await tx.request.create({
                data: {
                    userEmail,
                    hospital: {
                        connect: { id: hospital.id }
                    },
                    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    user:{
                        connect:{
                            id:userId
                        }
                    }
                }
            });

            if (uniqueCode) {
                await tx.link.updateMany({
                    where: {
                        url: uniqueCode as string
                    },
                    data: {
                        isActive: false
                    }
                });
            }
        });

        res.status(201).json({
            message: "Hospital created successfully",
            success: true,
        });
    } catch (error) {
        console.error("Error in hospital creation:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));

router.get('/get-hospital-details', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const hospital = await prisma.hospital.findFirst({
            where: {
                adminId: userId,
            },
            select: {
                id: true,
                name: true,
                departments: true,
                facilities: true,
                services: true,
                hours: true,
                location: {
                    select: {
                        lat: true,
                        lng: true,
                        address: true
                    }
                },
                doctors: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        picture: true,
                    }
                },
                labs: {
                    select: {
                        id: true,
                        name: true,
                        picture: true,
                        location: {
                            select: {
                                lat: true,
                                lng: true,
                                address: true
                            }
                        }
                    }
                }
            }
        });

        if (!hospital) return res.status(404).json({ message: "Hospital not found" });

        res.status(200).json(hospital);

    } catch (error) {
        console.error("Error fetching hospital details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

router.put('/update', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.query;
    const {
        name,
        departments,
        facilities,
        services,
        hours,
        location
    } = req.body;

    const hospital = await prisma.hospital.findFirst({
        where: { id: id as string },
        include: { location: true }
    });

    if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
    }

    if (location) {
        await prisma.location.update({
            where: { id: hospital.locationId },
            data: {
                lat: location.lat || hospital.location.lat,
                lng: location.lng || hospital.location.lng,
                address: location.address || hospital.location.address
            }
        });
    }

    await prisma.hospital.update({
        where: { id: id as string },
        data: {
            name,
            departments: departments || hospital.departments,
            facilities: facilities || hospital.facilities,
            services: services || hospital.services,
            hours: hours || hospital.hours
        }
    });

    res.status(200).json({
        message: "Hospital updated successfully",
    });
}));

//* Full roster for the super admin console, every status included.
router.get('/admin/all', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const hospitals = await prisma.hospital.findMany({
            include: {
                location: true,
                admin: { select: { id: true, name: true, email: true, phone: true } },
                _count: { select: { doctors: true, labs: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(hospitals);
    } catch (error) {
        console.error("Error listing hospitals:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

//* Suspend or reactivate a hospital, hiding/restoring it for patients.
router.put('/suspend', authenticateToken, isSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        const { status } = req.body as { status?: 'ACTIVE' | 'SUSPENDED' };

        if (!id) {
            return res.status(400).json({ message: "Hospital ID is required" });
        }

        if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
            return res.status(400).json({ message: "status must be ACTIVE or SUSPENDED" });
        }

        const hospital = await prisma.hospital.update({
            where: { id: id as string },
            data: { status }
        });

        res.status(200).json({ message: `Hospital ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'}`, hospital });
    } catch (error) {
        console.error("Error updating hospital status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));

export default router;