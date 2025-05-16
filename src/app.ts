import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.routes';
import doctor_hospitalRoutes from './routes/doctor-hospital.routes';
import hospitalRoutes from './routes/hospital.routes';
import labRoutes from './routes/lab.routes';
import searchRoutes from './routes/search.routes';
import paymentRouter from './routes/payment.routes';

dotenv.config();
const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('Hello, nishant!');
});

app.use("/api/v1/auth", authRoutes); //* all-verified
app.use('/api/v1/hospitals', hospitalRoutes); //* all-verified
app.use('/api/v1/labs', labRoutes); //* all-verified
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/doctor-hospitals', doctor_hospitalRoutes);
app.use('/api/v1/payment', paymentRouter); //* all-verified
app.use('/api/v1/search', searchRoutes);


export default app;