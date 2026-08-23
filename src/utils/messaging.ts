import twilio, { Twilio } from 'twilio';

/**
 * Messaging for SMS + WhatsApp.
 *
 * Twilio credentials are optional. When they are absent (local dev, CI, or a
 * deploy where the client has not bought a Twilio number yet) we do NOT throw:
 * we log the message and report `delivered: false` so callers can decide what
 * to do. This keeps OTP sign-in and booking confirmations testable end to end
 * before any paid provider is wired up.
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsFrom = process.env.TWILIO_PHONE_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

export const smsConfigured = Boolean(accountSid && authToken && smsFrom);
export const whatsappConfigured = Boolean(accountSid && authToken && whatsappFrom);

let client: Twilio | null = null;
if (accountSid && authToken) {
    try {
        client = twilio(accountSid, authToken);
    } catch (error) {
        console.warn('[messaging] Twilio client could not be created; falling back to log-only mode.', error);
        client = null;
    }
}

export interface DeliveryResult {
    delivered: boolean;
    channel: 'sms' | 'whatsapp';
    reason?: string;
}

const send = async (
    channel: 'sms' | 'whatsapp',
    to: string,
    body: string
): Promise<DeliveryResult> => {
    const from = channel === 'sms' ? smsFrom : whatsappFrom;

    if (!client || !from) {
        console.info(`[messaging:${channel}] (not configured) to=${to} :: ${body}`);
        return { delivered: false, channel, reason: 'provider_not_configured' };
    }

    try {
        await client.messages.create({
            from: channel === 'whatsapp' ? `whatsapp:${from}` : from,
            to: channel === 'whatsapp' ? `whatsapp:${to}` : to,
            body,
        });
        return { delivered: true, channel };
    } catch (error) {
        console.error(`[messaging:${channel}] send failed to=${to}`, error);
        return { delivered: false, channel, reason: 'provider_error' };
    }
};

export const sendSms = (to: string, body: string) => send('sms', to, body);
export const sendWhatsApp = (to: string, body: string) => send('whatsapp', to, body);

/**
 * Booking confirmation over WhatsApp, falling back to SMS when WhatsApp is not
 * configured. Never throws: a failed confirmation must not fail the booking.
 */
export const sendBookingConfirmation = async (to: string, body: string): Promise<DeliveryResult> => {
    const viaWhatsApp = await sendWhatsApp(to, body);
    if (viaWhatsApp.delivered) return viaWhatsApp;
    return sendSms(to, body);
};
