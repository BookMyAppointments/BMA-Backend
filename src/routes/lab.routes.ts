import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();
//* -------------------------- LAB CRUD OPERATIONS -------------------------- *//

//* Create a new lab (Admin only) (verified**)
router.post('/create/:hospitalId', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { hospitalId } = req.params;
    const {
        name, 
        services,
        location 
    } = req.body;

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

//* Get all labs for a hospital (public) (verified**)
router.get('/get/:hospitalId', asyncHandler(async (req: Request, res: Response) => {
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

// Get all labs (public) (verified**)
router.get('/all', asyncHandler(async (req: Request, res: Response) => {
    const { service } = req.query;

    const where: any = {};

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

//* Get lab by ID (public) (verified**)
router.get('/find/:id', asyncHandler(async (req: Request, res: Response) => {
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

//* Update lab (Admin only) (verified**)
router.put('/update/:id', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { 
        name, 
        services, 
        location 
    } = req.body;

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

//* Delete lab (Admin only) (verified**)
router.delete('/update/:id', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

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