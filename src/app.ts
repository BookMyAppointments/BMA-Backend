import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
import hospitalRoutes from './routes/hospital.routes';
import contactRoutes from './routes/contact.routes';
import labRoutes from './routes/lab.routes';
import searchRoutes from './routes/search.routes';
import appointmentRoutes from './routes/appointment.routes';
import testRoutes from './routes/test.routes';
import file_uploadRoutes from './services/file-upload.service';
import RemainderRoutes from './routes/remainder.routes';
import adminRoutes from './routes/admin.routes';
import otpRoutes from './routes/otp.routes';
import paymentRouter from './routes/payment.routes';

dotenv.config();
const app: Application = express();

app.use(express.json());
/**
 * Allowed browser origins.
 *
 * CORS_ORIGIN takes a comma-separated list, because a Vercel project has more
 * than one hostname: the production domain, any custom domain, and a fresh
 * URL for every preview deploy. A single value would break previews.
 */
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// Local dev always works without configuring anything.
const devOrigins = ['http://localhost:3000'];

app.use(cors({
    origin(origin, callback) {
        // Same-origin, curl, and server-to-server calls send no Origin header.
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || devOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Preview deploys of the configured Vercel projects.
        if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Hello, BookMyApppointment!');
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);

app.use('/api/v1/labs', labRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/file-upload', file_uploadRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/remainders', RemainderRoutes);
app.use('/api/v1/otp', otpRoutes);
app.use('/api/v1/payment', paymentRouter);

export default app;