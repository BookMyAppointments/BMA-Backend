import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { calculateDistance } from '../utils/helpers'
import { AppointmentStatus, Hospital } from '@prisma/client';

const router = Router();

//* SEARCH & FILTER OPERATIONS

//* Search doctors by name/specialization
router.get('/doctors', asyncHandler(async (req: Request, res: Response) => {
    const { name, specialization, hospitalId } = req.query;

    const where: any = {
        doctor: {
            user: {
                name: name ? { contains: name as string, mode: 'insensitive' } : undefined
            },
            specialization: specialization ? { contains: specialization as string, mode: 'insensitive' } : undefined
        }
    };

    if (hospitalId) {
        where.hospitalId = hospitalId as string;
    }

    const doctors = await prisma.doctorHospital.findMany({
        where,
        include: {
            doctor: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profile: true
                        }
                    },
                    availability: true,
                    reviews: true
                }
            },
            hospital: {
                include: {
                    location: true
                }
            }
        }
    });

    res.status(200).json(doctors);
}));

// Search hospitals by name/location (with distance filtering but cordinates required ...latitude and longitude ) ---
router.get('/hospitals/search', asyncHandler(async (req: Request, res: Response) => {
    const { name, lat, lng, radius, department, service } = req.query;

    const where: any = {
        name: name ? { contains: name as string, mode: 'insensitive' } : undefined,
        departments: department ? { has: department as string } : undefined,
        services: service ? { has: service as string } : undefined
    };

    let hospitals = await prisma.hospital.findMany({
        where,
        include: {
            location: true,
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
            },
            labs: true
        }
    });

    // Filter by distance if coordinates provided
    if (lat && lng && radius) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        const searchRadius = parseFloat(radius as string);

        hospitals = hospitals.filter(hospital => {
            if (!hospital.location) return false;

            const distance = calculateDistance(
                userLat,
                userLng,
                hospital.location.lat,
                hospital.location.lng
            );

            return distance <= searchRadius;
        });
    }

    res.status(200).json(hospitals);
}));

//* Search tests by name/category
router.get('/tests', asyncHandler(async (req: Request, res: Response) => {
    const { name, category, labId } = req.query;

    const where: any = {
        name: name ? { contains: name as string, mode: 'insensitive' } : undefined,
        category: category ? { contains: category as string, mode: 'insensitive' } : undefined,
        labId: labId ? labId as string : undefined
    };

    const tests = await prisma.medicalTest.findMany({
        where,
        include: {
            lab: {
                include: {
                    hospital: true,
                    location: true
                }
            }
        }
    });

    res.status(200).json(tests);
}));

// Filter appointments by status (authenticated users only)
router.get('/appointments', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { status } = req.query;

    const where = {
        OR: [
            { userId },
            { doctor: { userId } }
        ],
        status: status ? status as AppointmentStatus : undefined
    };

    const appointments = await prisma.appointment.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            doctor: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            lab: {
                include: {
                    hospital: true,
                    location: true
                }
            },
            test: true
        }
    });

    res.status(200).json(appointments);
}));

// Location-based search for all entities
router.get('/nearby', asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius, type } = req.query;

    if (!lat || !lng || !radius) {
        return res.status(400).json({ message: "Latitude, longitude and radius are required" });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const searchRadius = parseFloat(radius as string);

    let results: any = {};

    // Search hospitals if type is not specified or includes hospitals
    if (!type || (type as string).includes('hospitals')) {
        const hospitals = await prisma.hospital.findMany({
            include: {
                location: true,
                doctors: true,
                labs: true
            }
        });

        results.hospitals = hospitals.filter((hospital: any) => {
            if (!hospital.locationId) return false;

            const distance = calculateDistance(
                userLat,
                userLng,
                hospital.location.lat,
                hospital.location.lng
            );

            return distance <= searchRadius;
        });
    }

    // Search labs if type is not specified or includes labs
    if (!type || (type as string).includes('labs')) {
        const labs = await prisma.lab.findMany({
            include: {
                location: true,
                hospital: true
            }
        });

        results.labs = labs.filter(lab => {
            if (!lab.location) return false;

            const distance = calculateDistance(
                userLat,
                userLng,
                lab.location.lat,
                lab.location.lng
            );

            return distance <= searchRadius;
        });
    }

    // Search doctors if type is not specified or includes doctors
    if (!type || (type as string).includes('doctors')) {
        const doctorAffiliations = await prisma.doctorHospital.findMany({
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
                        availability: true
                    }
                },
                hospital: {
                    include: {
                        location: true
                    }
                }
            }
        });

        results.doctors = doctorAffiliations.filter(affiliation => {
            if (!affiliation.hospital.location) return false;

            const distance = calculateDistance(
                userLat,
                userLng,
                affiliation.hospital.location.lat,
                affiliation.hospital.location.lng
            );

            return distance <= searchRadius;
        });
    }

    res.status(200).json(results);
}));



export default router;