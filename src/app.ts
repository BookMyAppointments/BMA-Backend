import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/user.routes';

dotenv.config();
const app  : Application = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}))

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use("/api/v1/auth", authRoutes);

export default app;