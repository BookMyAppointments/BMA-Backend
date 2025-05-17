import express from 'express';
import crypto from 'crypto';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { razorpay } from '../lib/razorpay'

const router = express.Router();
const prisma = new PrismaClient();

//* ------------------------- PAYMENT OPERATIONS ------------------------- *//

//* Create a new order
router.post('/create-order', asyncHandler(async (req, res) => {
    try {
        const { userId, amount, method } = req.body;

        if (!userId || !amount || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100, //! Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        });

        const newPayment = await prisma.payment.create({
            data: {
                userId,
                amount,
                method,
                status: PaymentStatus.PAID,
                paidAt: new Date(),
                invoiceUrl: `https://dashboard.razorpay.com/app/orders/${razorpayOrder.id}`,
            },
        });

        return res.json({
            orderId: razorpayOrder.id,
            key: process.env.RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            paymentId: newPayment.id,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));

//* Verify the payment
router.post('/verify', asyncHandler(async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

        const hmac = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const isValid = hmac === razorpay_signature;

        if (!isValid) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.FAILED,
                },
            });
            return res.status(400).json({ error: 'Invalid signature' });
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: PaymentStatus.PAID,
                paidAt: new Date(),
            },
        });

        return res.json({ success: true, message: 'Payment verified' });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));

export default router;
