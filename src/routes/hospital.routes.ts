import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

//* --------------------- HOSPITAL CRUD OPERATIONS --------------------- *//

//* Create a new hospital (Admin only) )(verified**)
router.post('/create', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
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

    // Create location first
    const newLocation = await prisma.location.create({
        data: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
        }
    });

    // Create hospital with location
    const hospital = await prisma.hospital.create({
        data: {
            name,
            departments: departments,
            facilities: facilities,
            services: services,
            hours: hours,
            location: {
                connect: { id: newLocation.id }
            }
        },
        include: {
            location: true
        }
    });

    res.status(201).json({
        message: "Hospital created successfully",
        hospital
    });
}));

//* Get all hospitals (verified**)
router.get('/get', asyncHandler(async (req: Request, res: Response) => {
    const { department, service } = req.query;

    const where: any = {};

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
            location: true,
            labs: {
                include: {
                    location: true
                }
            },
            doctors: {
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    res.status(200).json(hospitals);
}));

//* Get hospital by ID (verified**)
router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const hospital = await prisma.hospital.findFirst({
        where: { id },
        include: {
            location: true,
            labs: {
                include: {
                    location: true
                }
            },
            doctors: {
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    profile: true
                                }
                            },
                            availability: true,
                            reviews: true
                        }
                    }
                }
            }
        }
    });

    if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
    }

    res.status(200).json(hospital);
}));

//* Update hospital (Admin only) (verified**)
router.put('/update/:id', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        name,
        departments,
        facilities,
        services,
        hours,
        location
    } = req.body;

    const hospital = await prisma.hospital.findFirst({
        where: { id },
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

    const updatedHospital = await prisma.hospital.update({
        where: { id },
        data: {
            name,
            departments: departments || hospital.departments,
            facilities: facilities || hospital.facilities,
            services: services || hospital.services,
            hours: hours || hospital.hours
        },
        include: {
            location: true
        }
    });

    res.status(200).json({
        message: "Hospital updated successfully",
        hospital: updatedHospital
    });
}));

//* Delete hospital (Admin only) (verified**)
router.delete('/delete/:id', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Get hospital to delete (with location)
    const hospital = await prisma.hospital.findUnique({
        where: { id },
        include: { location: true }
    });

    if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
    }

    // Delete hospital and its location
    await prisma.hospital.delete({
        where: { id }
    });

    await prisma.location.delete({
        where: { id: hospital.locationId }
    });

    res.status(200).json({ message: "Hospital deleted successfully" });
}));

export default router;