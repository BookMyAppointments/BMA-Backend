import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { DoctorCreateInput, DoctorUpdateInput } from '../types/doctorTypes';
import { isDoctor } from '../middlewares/doctor.middleware';

const router = Router();
interface Review {
  rating: number;
}

//* Add a new doctor profile
router.post('/create', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { specialization, qualifications }: DoctorCreateInput = req.body;

  const existingDoctor = await prisma.doctor.findUnique({
    where: { userId }
  });

  if (existingDoctor) {
    return res.status(400).json({ message: "Doctor profile already exists" });
  }

  const doctor = await prisma.doctor.create({
    data: {
      userId,
      specialization: specialization || [],
      qualifications: qualifications || [],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  res.status(201).json({
    message: "Doctor profile created successfully",
    doctor
  });
}));

//* ------------------ Doctor Profile ------------------ *//

//* Get doc profile 
router.get('/profile', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          
        }
      },
      reviews : {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      availability: true
    }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  res.status(200).json(doctor);
}));

//* Update doc profile
router.put('/profile', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { specialization, qualifications, ratings }: DoctorUpdateInput = req.body;

  const updatedDoctor = await prisma.doctor.update({
    where: { userId },
    data: {
      specialization,
      qualifications,
      ratings
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    }
  });

  res.status(200).json({
    message: "Doctor profile updated successfully",
    doctor: updatedDoctor
  });
}));

//* ---------------------- Doctor Profile ------------------ *//

//* Add availability slots
router.post('/availability', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { day, startTime, endTime } = req.body;
  
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }
  
  const existingAvailability = await prisma.availability.findFirst({
    where: {
      doctorId: doctor.id,
      day,
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gte: startTime }
        },
        {
          startTime: { lte: endTime },
          endTime: { gte: endTime }
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      ]
    }
  });
  
  if (existingAvailability) {
    return res.status(400).json({ message: "Time slot overlaps with existing availability" });
  }
  
  const availability = await prisma.availability.create({
    data: {
      doctorId: doctor.id,
      day,
      startTime,
      endTime
    }
  });
  
  res.status(201).json({
    message: "Availability added successfully",
    availability
  });
}));

//* Get all availability slots
router.get('/availability', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }
  
  const availability = await prisma.availability.findMany({
    where: { doctorId: doctor.id }
  });
  
  res.status(200).json(availability);
}));

//* Delete availability slot
router.delete('/availability/:id', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { id } = req.params;
  
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }
  
  const availability = await prisma.availability.findFirst({
    where: {
      id,
      doctorId: doctor.id
    }
  });
  
  if (!availability) {
    return res.status(404).json({ message: "Availability not found or not authorized" });
  }
  
  await prisma.availability.delete({
    where: { id }
  });
  
  res.status(200).json({ message: "Availability deleted successfully" });
}));

//* ---------------------- Doctor Reviews & Appointments ------------------ *//

//*   Get all reviews for doctor
router.get('/reviews', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });
  
  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const reviews = await prisma.review.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json(reviews);
}));

//* Get doc appointments
router.get('/appointments', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor profile not found" });
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true
        }
      }
    }
  });

  res.status(200).json(appointments);
}));

//* Complete doctor details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: true
        }
      },
      availability: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  let averageRating = null;
  if (doctor.reviews.length > 0) {
    const total = doctor.reviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
    averageRating = total / doctor.reviews.length;
  }

  res.status(200).json({
    ...doctor,
    averageRating,
    reviewCount: doctor.reviews.length
  });
}));

export default router;