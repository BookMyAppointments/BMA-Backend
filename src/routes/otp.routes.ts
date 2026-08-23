import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { generateVerificationCode } from '../utils/helpers';
import { sendSms, smsConfigured } from '../utils/messaging';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

const OTP_TTL_MINUTES = 10;
const isProduction = process.env.NODE_ENV === 'production';

/** Keep only digits, then require a plausible 10-15 digit number. */
const normalisePhone = (raw: unknown): string | null => {
    if (typeof raw !== 'string') return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return null;
    // Default to India (+91) when a bare 10-digit number is supplied.
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

//* Step 1: request an OTP for a phone number. Creates the user on first sign-in.
router.post('/request', asyncHandler(async (req: Request, res: Response) => {
    const phone = normalisePhone(req.body?.phone);
    if (!phone) {
        return res.status(400).json({ message: 'Enter a valid mobile number.' });
    }

    const code = generateVerificationCode();
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const existing = await prisma.user.findUnique({ where: { phone } });

    if (existing) {
        await prisma.user.update({
            where: { id: existing.id },
            data: { otpCode: code, otpExpiresAt },
        });
    } else {
        // Placeholder email keeps the existing unique-email constraint satisfied
        // until the user fills in their profile.
        await prisma.user.create({
            data: {
                phone,
                email: `${phone}@phone.bookmyappointments.local`,
                password: '',
                name: '',
                role: 'NORMAL',
                verified: false,
                otpCode: code,
                otpExpiresAt,
            },
        });
    }

    const delivery = await sendSms(phone, `${code} is your BookMyAppointments verification code. It expires in ${OTP_TTL_MINUTES} minutes.`);

    res.status(200).json({
        message: delivery.delivered
            ? 'Verification code sent.'
            : 'Verification code generated. SMS delivery is not configured on this environment.',
        smsConfigured,
        // Outside production, hand the code back so the flow is testable without
        // a paid SMS provider. Never do this in production.
        ...(isProduction ? {} : { devCode: code }),
    });
}));

//* Step 2: verify the OTP and issue a session token.
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
    const phone = normalisePhone(req.body?.phone);
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!phone || !code) {
        return res.status(400).json({ message: 'Mobile number and code are required.' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
        return res.status(400).json({ message: 'Request a new code to continue.' });
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
        return res.status(400).json({ message: 'That code has expired. Request a new one.' });
    }

    if (user.otpCode !== code) {
        return res.status(400).json({ message: 'That code is not correct.' });
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiresAt: null, verified: true },
    });

    const token = jwt.sign(
        { userId: updated.id, email: updated.email, role: updated.role },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
    );

    const { password: _password, otpCode: _otp, ...safeUser } = updated;

    res.status(200).json({
        token,
        user: safeUser,
        // The client routes new users into profile setup instead of the home screen.
        profileComplete: Boolean(updated.name && updated.dob),
    });
}));

//* Complete or update the health profile captured after first sign-in.
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { name, dob, gender, bloodGroup, heightCm, weightKg, address, email } = req.body ?? {};

    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof address === 'string') data.address = address.trim();
    if (dob) data.dob = new Date(dob);
    if (gender) data.gender = gender;
    if (bloodGroup) data.bloodGroup = bloodGroup;
    if (heightCm !== undefined && heightCm !== null && heightCm !== '') data.heightCm = Number(heightCm);
    if (weightKg !== undefined && weightKg !== null && weightKg !== '') data.weightKg = Number(weightKg);

    if (typeof email === 'string' && email.trim()) {
        const taken = await prisma.user.findFirst({
            where: { email: email.trim(), NOT: { id: userId } },
        });
        if (taken) {
            return res.status(400).json({ message: 'That email is already in use.' });
        }
        data.email = email.trim();
    }

    const updated = await prisma.user.update({ where: { id: userId }, data });
    const { password: _password, otpCode: _otp, ...safeUser } = updated;

    res.status(200).json({ user: safeUser, message: 'Profile saved.' });
}));

export default router;
