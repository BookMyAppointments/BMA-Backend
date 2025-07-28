import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendContactEmail, sendContactConfirmation } from '../emails/contactMail';

const router = Router();

router.post('/send', asyncHandler(async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const contactParams = {
            name,
            email,
            subject,
            message,
            type: 'contact_form' as const
        };

        const adminEmailResult = await sendContactEmail(contactParams);
        
        if (!adminEmailResult.success) {
            return res.status(500).json({ message: 'Failed to send message to admin' });
        }

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error in contact route:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
}));

export default router;