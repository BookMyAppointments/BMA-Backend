import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const sendSms = async (to: string, body: string) => {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error };
  }
};
