import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayConfigured = Boolean(keyId && keySecret);

/**
 * Null when Razorpay keys are absent so the app can still boot and offer
 * pay-at-hospital. Callers must check `razorpayConfigured` before using it.
 */
export const razorpay = razorpayConfigured
    ? new Razorpay({ key_id: keyId!, key_secret: keySecret! })
    : null;
