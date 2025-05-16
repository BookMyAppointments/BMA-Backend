import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {sendNotification} from '../utils/notification.service'




// Type definitions for operating hours and availability
interface OperatingHour {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
}

interface DoctorAvailability {
    dayOfWeek: number;
    startTime: Date;
    endTime: Date;
}

const router = Router();

// Create a new appointment (doctor or lab test)
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { doctorId, labId, testId, scheduledAt } = req.body;

        // Validation
        if (!scheduledAt) {
            return res.status(400).json({ message: "Scheduled time is required" });
        }

        if ((!doctorId && !labId) || (doctorId && labId)) {
            return res.status(400).json({ message: "Either doctorId or labId must be provided, but not both" });
        }

        if (labId && !testId) {
            return res.status(400).json({ message: "testId is required for lab appointments" });
        }

        const appointmentTime = new Date(scheduledAt);
        const now = new Date();

        // Validate appointment time is in the future
        if (appointmentTime <= now) {
            return res.status(400).json({ message: "Appointment time must be in the future" });
        }

        // Check for existing appointments at the same time
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                userId,
                scheduledAt: appointmentTime,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: "You already have an appointment at this time" });
        }

        // Check availability
        if (doctorId) {
            const doctorAvailability = await prisma.doctorAvailability.findFirst({
                where: {
                    doctorId,
                    dayOfWeek: appointmentTime.getDay(),
                    startTime: { lte: appointmentTime },
                    endTime: { gte: new Date(appointmentTime.getTime() + 30 * 60000) }
                }
            });

            if (!doctorAvailability) {
                return res.status(400).json({ message: "Doctor is not available at this time" });
            }

            const overlappingAppointment = await prisma.appointment.findFirst({
                where: {
                    doctorId,
                    scheduledAt: appointmentTime,
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    }
                }
            });

            if (overlappingAppointment) {
                return res.status(400).json({ message: "This time slot is already booked" });
            }
        } else if (labId) {
            const lab = await prisma.lab.findUnique({
                where: { id: labId },
                include: { operatingHours: true }
            });

            if (!lab) {
                return res.status(404).json({ message: "Lab not found" });
            }

            const operatingDay = lab.operatingHours.find(
                (oh: OperatingHour) => oh.dayOfWeek === appointmentTime.getDay()
            );

            if (!operatingDay || 
                appointmentTime.getHours() < operatingDay.startHour || 
                (appointmentTime.getHours() === operatingDay.endHour && appointmentTime.getMinutes() > 0) ||
                appointmentTime.getHours() > operatingDay.endHour) {
                return res.status(400).json({ message: "Lab is closed at this time" });
            }

            const concurrentAppointments = await prisma.appointment.count({
                where: {
                    labId,
                    scheduledAt: {
                        gte: new Date(appointmentTime.getTime() - 14 * 60000),
                        lte: new Date(appointmentTime.getTime() + 14 * 60000)
                    },
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    }
                }
            });

            if (concurrentAppointments >= lab.simultaneousAppointments) {
                return res.status(400).json({ message: "Lab is fully booked at this time" });
            }
        }

        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                userId,
                doctorId,
                labId,
                testId,
                scheduledAt: appointmentTime,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                doctor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                lab: {
                    include: {
                        hospital: true
                    }
                },
                test: true
            }
        });

        // Send notifications
        try {
            if (doctorId && appointment.doctor?.user.id) {
                await sendNotification({
                    userId: appointment.doctor.user.id,
                    title: 'New Appointment Request',
                    message: `You have a new appointment request from ${appointment.user.name}`,
                    type: 'APPOINTMENT_REQUEST'
                });
            } else if (labId) {
                const confirmedAppointment = await prisma.appointment.update({
                    where: { id: appointment.id },
                    data: { status: 'CONFIRMED' },
                    include: {
                        user: true,
                        lab: true,
                        test: true
                    }
                });

                await sendNotification({
                    userId,
                    title: 'Lab Appointment Confirmed',
                    message: `Your ${confirmedAppointment.test?.name} test at ${confirmedAppointment.lab?.name} is confirmed for ${confirmedAppointment.scheduledAt}`,
                    type: 'APPOINTMENT_CONFIRMATION'
                });

                return res.status(201).json(confirmedAppointment);
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: "An error occurred while creating the appointment" });
    }
}));

// Confirm a pending appointment (for doctors)
router.patch('/:id/confirm', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                doctor: {
                    include: {
                        user: true
                    }
                },
                user: true
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctor?.userId !== userId) {
            return res.status(403).json({ message: "You can only confirm your own appointments" });
        }

        if (appointment.status !== 'PENDING') {
            return res.status(400).json({ message: "Only pending appointments can be confirmed" });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: 'CONFIRMED'
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true
                    }
                }
            }
        });

        try {
            await sendNotification({
                userId: updatedAppointment.userId,
                title: 'Appointment Confirmed',
                message: `Your appointment with Dr. ${updatedAppointment.doctor?.user.name} is confirmed for ${updatedAppointment.scheduledAt}`,
                type: 'APPOINTMENT_CONFIRMATION'
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Error confirming appointment:', error);
        res.status(500).json({ message: "An error occurred while confirming the appointment" });
    }
}));

// Reschedule an appointment
router.patch('/:id/reschedule', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;
        const { newTime } = req.body;

        if (!newTime) {
            return res.status(400).json({ message: "New time is required" });
        }

        const newAppointmentTime = new Date(newTime);
        const now = new Date();

        if (newAppointmentTime <= now) {
            return res.status(400).json({ message: "New appointment time must be in the future" });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true,
                        availability: true
                    }
                },
                lab: {
                    include: {
                        operatingHours: true
                    }
                }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.userId !== userId && appointment.doctor?.userId !== userId) {
            return res.status(403).json({ message: "You can only reschedule your own appointments" });
        }

        if (appointment.status === 'CANCELLED') {
            return res.status(400).json({ message: "Cannot reschedule a cancelled appointment" });
        }

        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({ message: "Cannot reschedule a completed appointment" });
        }

        if (appointment.doctorId) {
            const doctorAvailability = appointment.doctor?.availability.find(
                (av: DoctorAvailability) => av.dayOfWeek === newAppointmentTime.getDay() &&
                    av.startTime <= newAppointmentTime &&
                    av.endTime >= new Date(newAppointmentTime.getTime() + 30 * 60000)
            );

            if (!doctorAvailability) {
                return res.status(400).json({ message: "Doctor is not available at the new time" });
            }

            const overlappingAppointment = await prisma.appointment.findFirst({
                where: {
                    doctorId: appointment.doctorId,
                    scheduledAt: newAppointmentTime,
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    },
                    NOT: {
                        id: appointment.id
                    }
                }
            });

            if (overlappingAppointment) {
                return res.status(400).json({ message: "Doctor already has an appointment at the new time" });
            }
        } else if (appointment.labId) {
            const operatingDay = appointment.lab?.operatingHours.find(
                (oh: OperatingHour) => oh.dayOfWeek === newAppointmentTime.getDay()
            );

            if (!operatingDay || 
                newAppointmentTime.getHours() < operatingDay.startHour || 
                (newAppointmentTime.getHours() === operatingDay.endHour && newAppointmentTime.getMinutes() > 0) ||
                newAppointmentTime.getHours() > operatingDay.endHour) {
                return res.status(400).json({ message: "Lab is closed at the new time" });
            }

            const concurrentAppointments = await prisma.appointment.count({
                where: {
                    labId: appointment.labId,
                    scheduledAt: {
                        gte: new Date(newAppointmentTime.getTime() - 14 * 60000),
                        lte: new Date(newAppointmentTime.getTime() + 14 * 60000)
                    },
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    },
                    NOT: {
                        id: appointment.id
                    }
                }
            });

            if (concurrentAppointments >= appointment.lab?.simultaneousAppointments ) {
                return res.status(400).json({ message: "Lab is fully booked at the new time" });
            }
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                scheduledAt: newAppointmentTime,
                rescheduledAt: now,
                status: 'RESCHEDULED'
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true
                    }
                },
                lab: true,
                test: true
            }
        });

        try {
            if (appointment.doctorId) {
                const notificationRecipient = userId === appointment.userId ? 
                    appointment.doctor?.user.id! : appointment.userId;

                await sendNotification({
                    userId: notificationRecipient,
                    title: 'Appointment Rescheduled',
                    message: `Appointment with ${userId === appointment.userId ? 'you' : appointment.user.name} has been rescheduled to ${newAppointmentTime}`,
                    type: 'APPOINTMENT_RESCHEDULED'
                });
            } else if (appointment.labId) {
                await sendNotification({
                    userId: appointment.userId,
                    title: 'Lab Appointment Rescheduled',
                    message: `Your ${appointment.test?.name} test has been rescheduled to ${newAppointmentTime}`,
                    type: 'APPOINTMENT_RESCHEDULED'
                });
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        res.status(500).json({ message: "An error occurred while rescheduling the appointment" });
    }
}));

// Cancel an appointment
router.patch('/:id/cancel', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true
                    }
                },
                lab: true,
                test: true
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.userId !== userId && appointment.doctor?.userId !== userId) {
            return res.status(403).json({ message: "You can only cancel your own appointments" });
        }

        if (appointment.status === 'CANCELLED') {
            return res.status(400).json({ message: "Appointment is already cancelled" });
        }

        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({ message: "Cannot cancel a completed appointment" });
        }

        const now = new Date();
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                cancelledAt: now,
                status: 'CANCELLED'
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true
                    }
                },
                lab: true,
                test: true
            }
        });

        try {
            if (appointment.doctorId) {
                const notificationRecipient = userId === appointment.userId ? 
                    appointment.doctor?.user.id! : appointment.userId;

                await sendNotification({
                    userId: notificationRecipient,
                    title: 'Appointment Cancelled',
                    message: `Appointment with ${userId === appointment.userId ? 'you' : appointment.user.name} has been cancelled`,
                    type: 'APPOINTMENT_CANCELLED'
                });
            } else if (appointment.labId) {
                await sendNotification({
                    userId: appointment.userId,
                    title: 'Lab Appointment Cancelled',
                    message: `Your ${appointment.test?.name} test has been cancelled`,
                    type: 'APPOINTMENT_CANCELLED'
                });
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ message: "An error occurred while cancelling the appointment" });
    }
}));

// Mark appointment as completed (for doctors)
router.patch('/:id/complete', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                doctor: {
                    include: {
                        user: true
                    }
                },
                user: true
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (!appointment.doctorId || appointment.doctor?.userId !== userId) {
            return res.status(403).json({ message: "Only doctors can mark appointments as completed" });
        }

        if (appointment.status === 'CANCELLED') {
            return res.status(400).json({ message: "Cannot complete a cancelled appointment" });
        }

        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({ message: "Appointment is already completed" });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: 'COMPLETED'
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true
                    }
                }
            }
        });

        try {
            await sendNotification({
                userId: updatedAppointment.userId,
                title: 'Appointment Completed',
                message: `Your appointment with Dr. ${updatedAppointment.doctor?.user.name} has been marked as completed`,
                type: 'APPOINTMENT_COMPLETED'
            });
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error('Error completing appointment:', error);
        res.status(500).json({ message: "An error occurred while completing the appointment" });
    }
}));

// Get appointment details
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: true
                    }
                },
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
                        specialization: true,
                        reviews: true
                    }
                },
                lab: {
                    include: {
                        hospital: true,
                        location: true,
                        operatingHours: true
                    }
                },
                test: true
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.userId !== userId && appointment.doctor?.userId !== userId) {
            return res.status(403).json({ message: "You can only view your own appointments" });
        }

        res.status(200).json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ message: "An error occurred while fetching the appointment" });
    }
}));

// Get availability slots for a doctor
router.get('/doctors/:id/availability', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const selectedDate = new Date(date as string);
        const dayOfWeek = selectedDate.getDay();

        const availability = await prisma.doctorAvailability.findFirst({
            where: {
                doctorId: id,
                dayOfWeek
            }
        });

        if (!availability) {
            return res.status(200).json({ slots: [] });
        }

        const slots = [];
        const startTime = new Date(selectedDate);
        startTime.setHours(availability.startTime.getHours(), availability.startTime.getMinutes(), 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(availability.endTime.getHours(), availability.endTime.getMinutes(), 0, 0);

        let currentSlot = new Date(startTime);
        while (currentSlot < endTime) {
            const existingAppointment = await prisma.appointment.findFirst({
                where: {
                    doctorId: id,
                    scheduledAt: currentSlot,
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    }
                }
            });

            if (!existingAppointment) {
                slots.push(new Date(currentSlot));
            }

            currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
        }

        res.status(200).json({ slots });
    } catch (error) {
        console.error('Error fetching doctor availability:', error);
        res.status(500).json({ message: "An error occurred while fetching doctor availability" });
    }
}));

// Get availability slots for a lab
router.get('/labs/:id/availability', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const selectedDate = new Date(date as string);
        const dayOfWeek = selectedDate.getDay();

        const lab = await prisma.lab.findUnique({
            where: { id },
            include: {
                operatingHours: {
                    where: {
                        dayOfWeek
                    }
                }
            }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        if (lab.operatingHours.length === 0) {
            return res.status(200).json({ slots: [] });
        }

        const operatingHours = lab.operatingHours[0];
        const slots = [];
        
        const startTime = new Date(selectedDate);
        startTime.setHours(operatingHours.startHour, 0, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(operatingHours.endHour, 0, 0, 0);

        let currentSlot = new Date(startTime);
        while (currentSlot < endTime) {
            const concurrentAppointments = await prisma.appointment.count({
                where: {
                    labId: id,
                    scheduledAt: {
                        gte: new Date(currentSlot.getTime() - 14 * 60000),
                        lte: new Date(currentSlot.getTime() + 14 * 60000)
                    },
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    }
                }
            });

            if (concurrentAppointments < (lab.simultaneousAppointments ?? 0)) {
                slots.push(new Date(currentSlot));
            }

            currentSlot = new Date(currentSlot.getTime() + 15 * 60000);
        }

        res.status(200).json({ slots });
    } catch (error) {
        console.error('Error fetching lab availability:', error);
        res.status(500).json({ message: "An error occurred while fetching lab availability" });
    }
}));

export default router;