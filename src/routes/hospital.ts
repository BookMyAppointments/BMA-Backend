// src/routes/hospital.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Middleware to check if user is a doctor
const isDoctor = asyncHandler(async (req: Request, res: Response, next) => {
  const userId = (req as any).user.userId;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user || user.role !== 'DOCTOR') {
    return res.status(403).json({ message: "Access denied. Doctor role required." });
  }

  next();
});

// Add hospital affiliation 
router.post('/affiliations', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { hospitalId } = req.body;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId }
  });

  if (!hospital) {
    return res.status(404).json({ message: "Hospital not found" });
  }

  const existingAffiliation = await prisma.doctorHospital.findFirst({
    where: {
      doctorId: doctor.id,
      hospitalId
    }
  });

  if (existingAffiliation) {
    return res.status(400).json({ message: "Affiliation already exists" });
  }

  const affiliation = await prisma.doctorHospital.create({
    data: {
      doctorId: doctor.id,
      hospitalId
    },
    include: {
      hospital: true
    }
  });

  res.status(201).json({
    message: "Hospital affiliation added successfully",
    affiliation
  });
}));

// Get all hospital affiliations for doc
router.get('/affiliations', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const affiliations = await prisma.doctorHospital.findMany({
    where: { doctorId: doctor.id },
    include: {
      hospital: true
    }
  });

  res.status(200).json(affiliations);
}));

// Remove hospital affiliation
router.delete('/affiliations/:id', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const affiliation = await prisma.doctorHospital.findFirst({
    where: {
      id,
      doctorId: doctor.id
    }
  });

  if (!affiliation) {
    return res.status(404).json({ message: "Affiliation not found or not authorized" });
  }

  await prisma.doctorHospital.delete({
    where: { id }
  });

  res.status(200).json({ message: "Affiliation removed successfully" });
}));

// Get all hospitals (public)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const hospitals = await prisma.hospital.findMany({
    include: {
      doctors: {
        include: {
          doctor: {
            include: {
              user: {
                select: {
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

// Get hospital by ID (public)
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
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

// Create hospital (admin only - optional)
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { name, address, contact, facilities } = req.body;

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }

  const hospital = await prisma.hospital.create({
    data: {
      name,
      address: address || null,
      contact: contact || null,
      facilities: facilities || []
    }
  });

  res.status(201).json({
    message: "Hospital created successfully",
    hospital
  });
}));

export default router;