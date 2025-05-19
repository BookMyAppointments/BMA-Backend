import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isDoctor } from '../middlewares/doctor.middleware';

const router = Router();

//* ------------------------- HOSPITAL AFFILIATION OPERATIONS ------------------------- */

//* Add hospital affiliation for current doctor (verified**)
router.post('/affiliations/:hospitalId', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { hospitalId } = req.params;

  const doctor = await prisma.doctor.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const hospital = await prisma.hospital.findFirst({
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

//* Get all hospital affiliations for doc (verified**)
router.get('/affiliations', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

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

//* Remove hospital affiliation
router.delete('/affiliations/:id', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
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

//* Get all hospitals (public) (No-need, just an add-on) (verified**)
router.get('/get', asyncHandler(async (req: Request, res: Response) => {
  const hospitals = await prisma.hospital.findMany({
    include: {
      doctors: {
        include : {
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

  res.status(200).json(hospitals);
}));

//* Get hospital by ID (public) (verified**)
router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
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

export default router;