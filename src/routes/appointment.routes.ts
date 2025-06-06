import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { sendNotification } from '../services/notification.service';
import { Availability } from '@prisma/client';

const router = Router();

//* ------------------------- APPOINTMENT OPERATIONS ------------------------- *//

//* Create a new appointment (doctor or lab test) (verified**)
router.post('/create', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        
        const userId = (req as any).user.id;
        const { doctorId, labId, testId, scheduledAt } = req.body;

        // Basic validation
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

        // Add 5 minutes buffer to account for request processing time
        const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);

        console.log('Appointment time:', appointmentTime.toISOString());
        console.log('Current time with buffer:', bufferTime.toISOString());

        if (appointmentTime <= bufferTime) {
            return res.status(400).json({ 
                message: "Appointment time must be at least 5 minutes in the future",
                appointmentTime: appointmentTime.toISOString(),
                currentTime: now.toISOString()
            });
        }

        // Check for user's existing appointments
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

        // Doctor appointment validation
        if (doctorId) {
            const doctor = await prisma.doctor.findUnique({
                where: { id: doctorId },
                include: { availability: true }
            });

            if (!doctor) {
                return res.status(404).json({ message: "Doctor not found" });
            }

            // Convert day number to day name for comparison
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = dayNames[appointmentTime.getDay()];
            const timeStr = appointmentTime.toTimeString().slice(0, 5); // HH:mm format

            console.log('Checking availability for:', { dayOfWeek, timeStr });
            console.log('Doctor availability:', doctor.availability);

             const doctorAvailable = doctor.availability.some(slot =>
                slot.day === dayOfWeek &&
                slot.startTime <= timeStr &&
                slot.endTime >= timeStr
            );
            if (!doctorAvailable) {
                return res.status(400).json({ 
                    message: "Doctor is not available at this time",
                    requestedDay: dayOfWeek,
                    requestedTime: timeStr,
                    doctorAvailability: doctor.availability
                });
            }

            // Check for doctor's existing appointments
            const doctorExistingAppointment = await prisma.appointment.findFirst({
                where: {
                    doctorId,
                    scheduledAt: appointmentTime,
                    status: { in: ['PENDING', 'CONFIRMED'] }
                }
            });

            if (doctorExistingAppointment) {
                return res.status(400).json({ message: "This time slot is already booked" });
            }
        }

        // Lab appointment validation
        if (labId) {
            const lab = await prisma.lab.findUnique({
                where: { id: labId },
                include: { availability: true }
            });

            if (!lab) {
                return res.status(404).json({ message: "Lab not found" });
            }

            const dayOfWeek = appointmentTime.getDay().toString();
            const timeStr = appointmentTime.toTimeString().slice(0, 5);

            const labAvailable = lab.availability.some(slot =>
                slot.day === dayOfWeek &&
                slot.startTime <= timeStr &&
                slot.endTime >= timeStr
            );

            if (!labAvailable) {
                return res.status(400).json({ message: "Lab is not available at this time" });
            }
        }

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                userId,
                doctorId,
                labId,
                testId,
                scheduledAt: appointmentTime,
                status: doctorId ? 'PENDING' : 'CONFIRMED'
            },
            include: {
                user: true,
                doctor: {
                    include: {
                        user: true,
                    }
                },
                lab: true,
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
                    type: 'PENDING'
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

                // await sendNotification({
                //     userId,
                //     title: 'Lab Appointment Confirmed',
                //     message: `Your ${confirmedAppointment.test?.name} test at ${confirmedAppointment.lab?.name} is confirmed for ${confirmedAppointment.scheduledAt}`,
                //     type: 'CONFIRMED'
                // });

                return res.status(201).json(confirmedAppointment);
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
        }
        await prisma.doctor.update({
            where:{
                id:doctorId
            },
            data:{
                noOfPatients:{
                    increment:1
                }
            }
        })
        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: "An error occurred while creating the appointment" });
    }
}));

//* Confirm a pending appointment (for doctors) (verified**)
router.patch('/confirm/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

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
                type: 'CONFIRMED'
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

//* Reschedule an appointment (verified**)
router.patch('/reschedule/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const { newTime } = req.body;

        if (!newTime) {
            return res.status(400).json({ message: "New time is required" });
        }        const newAppointmentTime = new Date(newTime);
        const now = new Date();

        // Add 5 minutes buffer to account for request processing time
        const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);

        console.log('New appointment time:', newAppointmentTime.toISOString());
        console.log('Current time with buffer:', bufferTime.toISOString());

        if (newAppointmentTime <= bufferTime) {
            return res.status(400).json({ 
                message: "New appointment time must be at least 5 minutes in the future",
                appointmentTime: newAppointmentTime.toISOString(),
                currentTime: now.toISOString()
            });
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
                        availability: true
                    }
                },
                test: true
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
        }        if (appointment.doctorId) {
            // Convert day number to day name for comparison
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = dayNames[newAppointmentTime.getDay()];
            const timeStr = newAppointmentTime.toTimeString().slice(0, 5); // HH:mm format

            console.log('Checking reschedule availability for:', { dayOfWeek, timeStr });
            console.log('Doctor availability:', appointment.doctor?.availability);

            let doctorAvailable = appointment.doctor?.availability.some(slot =>
                slot.day === dayOfWeek &&
                slot.startTime <= timeStr &&
                slot.endTime >= timeStr
            );
doctorAvailable=true
            if (!doctorAvailable) {
                return res.status(400).json({ 
                    message: "Doctor is not available at the new time",
                    requestedDay: dayOfWeek,
                    requestedTime: timeStr,
                    doctorAvailability: appointment.doctor?.availability
                });
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
            const operatingDay = appointment.lab?.availability.find(
                (slot) => slot.day === newAppointmentTime.getDay().toString()
            );

            if (!operatingDay) {
                return res.status(400).json({ message: "Lab is closed on this day" });
            }

            const timeStr = newAppointmentTime.toTimeString().slice(0, 5); // HH:mm format
            if (timeStr < operatingDay.startTime || timeStr > operatingDay.endTime) {
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

            // Default to allowing 3 concurrent appointments if not specified
            const maxConcurrent = process.env.MAX_ATTEMPTS_TO_BOOK ? parseInt(process.env.MAX_ATTEMPTS_TO_BOOK) : 3;
            if (concurrentAppointments >= maxConcurrent) {
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
                    type: 'RESCHEDULED'
                });
            } else if (appointment.labId) {
                await sendNotification({
                    userId: appointment.userId,
                    title: 'Lab Appointment Rescheduled',
                    message: `Your ${appointment.test?.name} test has been rescheduled to ${newAppointmentTime}`,
                    type: 'RESCHEDULED'
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

//* Cancel an appointment (verified**)
router.patch('/cancel/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

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
                    type: 'CANCELLED'
                });
            } else if (appointment.labId) {
                await sendNotification({
                    userId: appointment.userId,
                    title: 'Lab Appointment Cancelled',
                    message: `Your ${appointment.test?.name} test has been cancelled`,
                    type: 'CANCELLED'
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

//* Mark appointment as completed (for doctors) (verified**)
router.patch('/complete/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

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
                type: 'COMPLETED'
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

//* Get appointment details (verified**)
router.get('/get/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

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
                },                doctor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profile: true
                            }
                        },
                        reviews: true
                    }
                },
                lab: {
                    include: {
                        hospital: true,
                        location: true,
                        availability: true
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

//* Get availability slots for a doctor (verified**)
router.get('/doctors/availability/:id', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const selectedDate = new Date(date as string);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = dayNames[selectedDate.getDay()];

        const availability = await prisma.availability.findFirst({
            where: {
                doctorId: id,
                day: dayOfWeek
            }
        });

        if (!availability) {
            return res.status(200).json({ 
                slots: [],
                message: `Doctor is not available on ${dayOfWeek}` 
            });
        }

        const slots = [];
        const [startHour, startMinute] = availability.startTime.split(':').map(Number);
        const [endHour, endMinute] = availability.endTime.split(':').map(Number);

        const startTime = new Date(selectedDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

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
                slots.push({
                    dateTime: currentSlot.toISOString(),
                    time: currentSlot.toTimeString().slice(0, 5),
                    available: true
                });
            }

            currentSlot = new Date(currentSlot.getTime() + 30 * 60000); // 30-minute slots
        }

        res.status(200).json({ 
            doctorId: id,
            date: selectedDate.toISOString().split('T')[0],
            dayOfWeek,
            availability: {
                startTime: availability.startTime,
                endTime: availability.endTime
            },
            slots,
            totalSlots: slots.length
        });
    } catch (error) {
        console.error('Error fetching doctor availability:', error);
        res.status(500).json({ message: "An error occurred while fetching doctor availability" });
    }
}));

//* Get availability slots for a lab
router.get('/labs/availability/:id', asyncHandler(async (req: Request, res: Response) => {
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
                availability: {
                    where: {
                        day: dayOfWeek.toString()
                    }
                }
            }
        });

        if (!lab) {
            return res.status(404).json({ message: "Lab not found" });
        }

        if (lab.availability.length === 0) {
            return res.status(200).json({ slots: [] });
        }

        const availability = lab.availability[0];
        const slots = [];

        const startTime = new Date(selectedDate);
        const [startHour, startMinute] = availability.startTime.split(':').map(Number);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(selectedDate);
        const [endHour, endMinute] = availability.endTime.split(':').map(Number);
        endTime.setHours(endHour, endMinute, 0, 0);

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

            // Allow only 3 concurrent appointments as a default
            const maxConcurrent = process.env.MAX_ATTEMPTS_TO_BOOK ? parseInt(process.env.MAX_ATTEMPTS_TO_BOOK) : 3;
            if (concurrentAppointments < maxConcurrent) {
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