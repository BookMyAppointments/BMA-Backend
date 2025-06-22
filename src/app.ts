import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
// import doctor_hospitalRoutes from './routes/doctor-hospital.routes';
import hospitalRoutes from './routes/hospital.routes';
import labRoutes from './routes/lab.routes';
import searchRoutes from './routes/search.routes';
// import paymentRouter from './routes/payment.routes';
import appointmentRoutes from './routes/appointment.routes';
import testRoutes from './routes/test.routes';
import file_uploadRoutes from './services/file-upload.service';

import { prisma } from './lib/prisma';
import { asyncHandler } from './utils/asyncHandler';

dotenv.config();
const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://localhost:3000', 'https://doctor-frontend-sigma.vercel.app'],
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Hello, BookMyApppointment!');
});

// app.get('/api/v1/make-superadmin', asyncHandler(async (req, res) => {
//     try {
//         const { email } = req.query;

//         const user = await prisma.user.findFirst({
//             where: { email: String(email) },
//             select: {
//                 id: true,
//                 email: true,
//                 role: true,
//             },
//         });

//         console.log('Making user superadmin:', user);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         const updatedUser = await prisma.user.update({
//             where: { email: String(email) },
//             data: { role: 'SUPERADMIN' },
//         });

//         res.status(200).json({ message: 'User made superadmin successfully', user: updatedUser });

//     } catch (error) {
//         console.error('Error making superadmin:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }));

app.use("/api/v1/auth", authRoutes); //* all-verified & tested
app.use('/api/v1/hospitals', hospitalRoutes); //* all-verified & tested
app.use('/api/v1/labs', labRoutes); //* all-verified & tested
app.use('/api/v1/doctors', doctorRoutes); //* all-verified & tested
// app.use('/api/v1/doctor-hospitals', doctor_hospitalRoutes); //* all-verified & tested
// app.use('/api/v1/payment', paymentRouter); //* all-verified & tested**
app.use('/api/v1/search', searchRoutes); //* all-verified  & tested
app.use('/api/v1/appointments', appointmentRoutes); //* all-verified & tested
app.use('/api/v1/tests', testRoutes);
app.use('/api/v1/file-upload', file_uploadRoutes); //* all-verified & tested

export default app;