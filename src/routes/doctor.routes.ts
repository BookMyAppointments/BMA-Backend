import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { Doctor, Review } from '@prisma/client';
import { isAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.get('/get/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        availability: {
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true
          }
        },
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

router.post('/create', authenticateToken, isAdmin, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query as { hospitalId: string };
    const { email, name, phone, specialization, qualifications, about, price, availability }: Doctor & { availability: { day: string, startTime: string, endTime: string }[] } = req.body;

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
        },
        availability: {
          create: availability.map(slot => ({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        }
      },
      include: {
        availability: true
      }
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
    const { email, name, phone, specialization, qualifications, about, price, availability }: Doctor & { availability: { day: string, startTime: string, endTime: string }[] } = req.body;

    if (!Array.isArray(specialization) || !Array.isArray(qualifications)) return res.status(400).json({ message: "Specialization and qualifications must be arrays" });

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!existingDoctor) return res.status(404).json({ message: "Doctor not found" });

    if (availability) {
      await prisma.availability.deleteMany({
        where: { doctorId }
      });
    }

    const updateData: any = {
      name: name || existingDoctor.name,
      email: email || existingDoctor.email,
      phone: phone || existingDoctor.phone,
      specialization: specialization || existingDoctor.specialization,
      qualifications: qualifications || existingDoctor.qualifications,
      price: price || existingDoctor.price,
      about: about || existingDoctor.about,
      ...(availability && {
        availability: {
          create: availability.map(slot => ({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        }
      })
    };

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
      include: {
        availability: true
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

router.post('/reviews', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { doctorId } = req.query as { doctorId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    })

    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

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

export default router;