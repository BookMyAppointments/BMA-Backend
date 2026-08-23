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
app.use(cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://localhost:3000', 'https://doctor-frontend-sigma.vercel.app'],
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