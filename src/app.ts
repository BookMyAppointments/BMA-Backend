import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/user.routes';
import doctorRoutes from './routes/doctor.Routes';
import hospitalRoutes from './routes/hospital';


dotenv.config();
const app  : Application = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}))

app.get('/', (req, res) => {
    res.send('Hello, nishant!');
});

app.use("/api/v1/auth", authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/hospitals', hospitalRoutes);

export default app;