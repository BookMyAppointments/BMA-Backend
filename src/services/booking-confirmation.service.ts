import { prisma } from '../lib/prisma';
import { sendBookingConfirmation } from '../utils/messaging';

const formatWhen = (date: Date) =>
    new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(date);

/**
 * Sends the booking confirmation over WhatsApp (falling back to SMS).
 * Never throws: a messaging outage must not fail a paid booking.
 */
export const sendAppointmentConfirmation = async (appointmentId: string): Promise<void> => {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                test: true,
                doctor: { include: { hospital: { include: { location: true } } } },
                lab: { include: { location: true } },
                payment: true,
            },
        });

        if (!appointment?.user?.phone) return;

        const when = formatWhen(appointment.scheduledAt);
        const paymentLine =
            appointment.payment?.method === 'PAY_AT_HOSPITAL'
                ? `Pay ₹${appointment.payment.amount} at the reception.`
                : appointment.payment?.status === 'PAID'
                  ? `Paid ₹${appointment.payment.amount}.`
                  : '';

        let body: string;
        if (appointment.doctor) {
            const place = appointment.doctor.hospital?.name ?? 'the clinic';
            const address = appointment.doctor.hospital?.location?.address;
            body = [
                `Your appointment is confirmed.`,
                ``,
                `${appointment.doctor.name}`,
                `${place}${address ? `, ${address}` : ''}`,
                `${when}`,
                paymentLine,
                ``,
                `Booking ref: ${appointment.id.slice(0, 8).toUpperCase()}`,
            ]
                .filter(Boolean)
                .join('\n');
        } else {
            const place = appointment.lab?.name ?? 'the lab';
            const address = appointment.lab?.location?.address;
            body = [
                `Your lab test is confirmed.`,
                ``,
                `${appointment.test?.name ?? 'Test'}`,
                `${place}${address ? `, ${address}` : ''}`,
                `${when}`,
                paymentLine,
                ``,
                `Booking ref: ${appointment.id.slice(0, 8).toUpperCase()}`,
            ]
                .filter(Boolean)
                .join('\n');
        }

        await sendBookingConfirmation(appointment.user.phone, body);
    } catch (error) {
        console.error('[booking-confirmation] failed for appointment', appointmentId, error);
    }
};
