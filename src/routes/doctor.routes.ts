import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { isDoctor } from '../middlewares/doctor.middleware';
import { Doctor, Review } from '@prisma/client';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.put('/get/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: doctor
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

router.post('/create', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query as { hospitalId: string };
    const { email, name, phone, specialization, qualifications, about, price }: Doctor = req.body;

    const hospital = await prisma.hospital.findFirst({
      where: { id: hospitalId }
    });

    if (!hospital) return res.status(400).json({ message: "This hospital does not exist!!" })

    if (!Array.isArray(specialization) || !Array.isArray(qualifications)) return res.status(400).json({ message: "Specialization and qualifications must be arrays" });

    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        phone,
        specialization: specialization,
        qualifications: qualifications,
        price,
        about: about || "",
        ratings: 0,
        noOfPatients: 0,
        hospital: {
          connect: { id: hospitalId }
        }
      },
    });

    if (!doctor) return res.status(500).json({ message: "Failed to create doctor profile" });

    res.status(201).json({
      message: "Doctor profile created successfully",
      doctor
    });
  } catch (error) {
    console.error("Error creating doctor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

router.put('/update', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.query as { doctorId: string };
    const { email, name, phone, specialization, qualifications, about, price }: Doctor = req.body;

    if (!Array.isArray(specialization) || !Array.isArray(qualifications)) return res.status(400).json({ message: "Specialization and qualifications must be arrays" });

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!existingDoctor) return res.status(404).json({ message: "Doctor not found" });

    const updateData: any = {
      name: name || existingDoctor.name,
      email: email || existingDoctor.email,
      phone: phone || existingDoctor.phone,
      specialization: specialization || existingDoctor.specialization,
      qualifications: qualifications || existingDoctor.qualifications,
      price: price || existingDoctor.price,
      about: about || existingDoctor.about
    };

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData
    });

    res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Get doc profile (verified**)
router.get('/profile', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
      include: {
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
        },
        availability: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

router.get("/search", authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    const doctor = await prisma.user.findFirst({
      where: { email: email as string },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);

  } catch (error) {
    console.error("Error searching doctor by email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Update doc profile (verified**)
router.put('/profile', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { specialization, qualifications, ratings, price, about }: Doctor = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId }
    });

    const updatedDoctor = await prisma.doctor.update({
      where: { id: userId },
      data: {
        specialization: specialization || doctor?.specialization,
        qualifications: qualifications || doctor?.qualifications,
        ratings: ratings || doctor?.ratings,
        price: price || doctor?.price,
        about: about || doctor?.about
      }
    });

    res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* ---------------------- Doctor Profile ------------------ *//

//* Add availability slots (verified**)
router.post('/availability', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { day, startTime, endTime } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
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
  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Get all availability slots (verified**)
router.get('/availability', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const availability = await prisma.availability.findMany({
      where: { doctorId: doctor.id }
    });

    res.status(200).json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Delete availability slot (verified**)
router.delete('/availability/:id', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
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
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* ---------------------- Doctor Reviews & Appointments ------------------ *//

//* Add a review for a doctor (verified**)
router.post('/reviews/:doctorId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { doctorId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    })

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const reviews = await prisma.review.create({
      data: {
        doctorId: doctorId,
        userId: userId,
        rating: req.body.rating,
        comment: req.body.comment
      }
    });

    res.status(201).json({
      message: "Review added successfully",
      review: reviews
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Get all reviews for doctor (verified**)
router.get('/reviews', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
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
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Get doc appointments (verified**)
router.get('/appointments', authenticateToken, isDoctor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
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
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

//* Complete doctor details (verified**)
router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
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
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));

export default router;