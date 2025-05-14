import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});