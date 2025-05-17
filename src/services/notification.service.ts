import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { sendSms } from "../utils/twilio";
import { sendNotificationEmail } from "../emails/NotificationMail";

interface Notification {
    userId: string;
    title: string;
    message: string;
    type: AppointmentStatus;
}

export const sendNotification = async (notification: Notification): Promise<void> => {
    try {
        const user = await prisma.user.findFirst({ where: { id: notification.userId } });
        if (!user) {
            throw new Error('User not found');
        }

        await prisma.notification.create({
            data: {
                userId: notification.userId,
                message: notification.message,
                type: notification.type,
            },
        });

        // const mailResult = await sendNotificationEmail({});  

        if (user.phone) {
            const smsResult = await sendSms(user.phone, notification.message);
            if (!smsResult.success) {
                throw new Error('Failed to send SMS');
            }
        }

    } catch (error) {
        console.error('Error sending notification:', error);
    }
};