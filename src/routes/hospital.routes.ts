import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

//  HOSPITAL CRUD OPERATIONS (saare points cover hai --- facility/department/hour )

// Create a new hospital (Admin only)
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { 
        name, 
        departments, 
        facilities, 
        services, 
        hours, 
        location 
    } = req.body;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
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
            departments: departments || [],
            facilities: facilities || [],
            services: services || [],
            hours: hours || '',
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

// Get all hospitals (KOI BHI KR SAKTA HAI USE)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
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

// Get hospital by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
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

// Update hospital (Admin only)
router.put('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { 
        name, 
        departments, 
        facilities, 
        services, 
        hours, 
        location 
    } = req.body;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // Get hospital to update
    const hospital = await prisma.hospital.findUnique({
        where: { id },
        include: { location: true }
    });

    if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
    }

    // Update location if provided
    if (location) {
        await prisma.location.update({
            where: { id: hospital.locationId },
            data: {
                lat: location.lat,
                lng: location.lng,
                address: location.address
            }
        });
    }

    // Update hospital
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

// Delete hospital (Admin only)
router.delete('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

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

// LAB CRUD OPERATIONS 

// Create a new lab (Admin only)
router.post('/:hospitalId/labs', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { hospitalId } = req.params;
    const { 
        name, 
        services, 
        location 
    } = req.body;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // Check if hospital exists
    const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId }
    });

    if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
    }

    // Create location first
    const newLocation = await prisma.location.create({
        data: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
        }
    });

    // Create lab with location
    const lab = await prisma.lab.create({
        data: {
            name,
            services: services || [],
            hospital: {
                connect: { id: hospitalId }
            },
            location: {
                connect: { id: newLocation.id }
            }
        },
        include: {
            location: true,
            hospital: true
        }
    });

    res.status(201).json({
        message: "Lab created successfully",
        lab
    });
}));

// Get all labs for a hospital (public)
router.get('/:hospitalId/labs', asyncHandler(async (req: Request, res: Response) => {
    const { hospitalId } = req.params;
    const { service } = req.query;

    const where: any = {
        hospitalId
    };

    if (service) {
        where.services = {
            has: service as string
        };
    }

    const labs = await prisma.lab.findMany({
        where,
        include: {
            location: true,
            hospital: true
        }
    });

    res.status(200).json(labs);
}));

// Get lab by ID 
router.get('/labs/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const lab = await prisma.lab.findUnique({
        where: { id },
        include: {
            location: true,
            hospital: true
        }
    });

    if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
    }

    res.status(200).json(lab);
}));

// Update lab (Admin only)
router.put('/labs/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { 
        name, 
        services, 
        location 
    } = req.body;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // Get lab to update
    const lab = await prisma.lab.findUnique({
        where: { id },
        include: { location: true }
    });

    if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
    }

    // Update location if provided
    if (location) {
        await prisma.location.update({
            where: { id: lab.locationId },
            data: {
                lat: location.lat,
                lng: location.lng,
                address: location.address
            }
        });
    }

    // Update lab
    const updatedLab = await prisma.lab.update({
        where: { id },
        data: {
            name,
            services: services || lab.services
        },
        include: {
            location: true,
            hospital: true
        }
    });

    res.status(200).json({
        message: "Lab updated successfully",
        lab: updatedLab
    });
}));

// Delete lab (Admin only)
router.delete('/labs/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Verify admin role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // Get lab to delete (with location)
    const lab = await prisma.lab.findUnique({
        where: { id },
        include: { location: true }
    });

    if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
    }

    // Delete lab and its location
    await prisma.lab.delete({
        where: { id }
    });

    await prisma.location.delete({
        where: { id: lab.locationId }
    });

    res.status(200).json({ message: "Lab deleted successfully" });
}));

export default router;