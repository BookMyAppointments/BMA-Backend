import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { razorpay, razorpayConfigured } from '../lib/razorpay';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { sendAppointmentConfirmation } from '../services/booking-confirmation.service';

const router = Router();

//* What payment options this deployment can actually offer.
router.get('/methods', asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
        online: razorpayConfigured,
        payAtHospital: true,
    });
}));

//* Create a payment for an appointment. Returns a Razorpay order when online
//* payment is configured; otherwise records a pay-at-hospital intent.
router.post('/create-order', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { appointmentId, amount, method } = req.body ?? {};

    if (!appointmentId || amount === undefined) {
        return res.status(400).json({ message: 'appointmentId and amount are required.' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, userId },
    });
    if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found.' });
    }

    const existing = await prisma.payment.findUnique({ where: { appointmentId } });
    if (existing?.status === 'PAID') {
        return res.status(400).json({ message: 'This appointment is already paid for.' });
    }

    const wantsOnline = method !== 'PAY_AT_HOSPITAL';

    if (wantsOnline && !razorpayConfigured) {
        return res.status(503).json({
            message: 'Online payment is not configured on this environment. Choose pay at hospital.',
        });
    }

    if (!wantsOnline) {
        const payment = await prisma.payment.upsert({
            where: { appointmentId },
            create: {
                userId,
                appointmentId,
                amount: numericAmount,
                method: 'PAY_AT_HOSPITAL',
                status: 'PENDING',
            },
            update: { amount: numericAmount, method: 'PAY_AT_HOSPITAL', status: 'PENDING' },
        });
        await sendAppointmentConfirmation(appointmentId);
        return res.status(200).json({ payment, requiresCheckout: false });
    }

    const order = await razorpay!.orders.create({
        amount: Math.round(numericAmount * 100), //! paise
        currency: 'INR',
        receipt: `appt_${appointmentId}`.slice(0, 40),
    });

    const payment = await prisma.payment.upsert({
        where: { appointmentId },
        create: {
            userId,
            appointmentId,
            amount: numericAmount,
            method: 'RAZORPAY',
            status: 'PENDING',
            providerOrderId: order.id,
        },
        update: { amount: numericAmount, method: 'RAZORPAY', status: 'PENDING', providerOrderId: order.id },
    });

    res.status(200).json({
        payment,
        requiresCheckout: true,
        checkout: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        },
    });
}));

//* Verify a Razorpay signature and mark the payment paid.
router.post('/verify', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

    if (!paymentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification fields.' });
    }

    const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId } });
    if (!payment) {
        return res.status(404).json({ message: 'Payment not found.' });
    }

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    // Constant-time compare so a signature cannot be guessed byte by byte.
    const signatureBuffer = Buffer.from(razorpay_signature);
    const expectedBuffer = Buffer.from(expected);
    const isValid =
        signatureBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
        return res.status(400).json({ message: 'Payment could not be verified.' });
    }

    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'PAID',
            paidAt: new Date(),
            providerPaymentId: razorpay_payment_id,
        },
    });

    if (updated.appointmentId) {
        await prisma.appointment.update({
            where: { id: updated.appointmentId },
            data: { status: 'CONFIRMED' },
        });
        await sendAppointmentConfirmation(updated.appointmentId);
    }

    res.status(200).json({ payment: updated, message: 'Payment confirmed.' });
}));

//* Payment attached to one appointment (used by the confirmation screen).
router.get('/by-appointment/:appointmentId', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const payment = await prisma.payment.findFirst({
        where: { appointmentId: req.params.appointmentId, userId },
    });
    res.status(200).json(payment);
}));

export default router;
