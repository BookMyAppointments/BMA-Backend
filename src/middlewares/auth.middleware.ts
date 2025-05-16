import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers['authorization'];
    const token = header?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    if (!verifiedToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await prisma.user.findFirst({
      where: { email: verifiedToken.email }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = user;
    next();

  } catch (error) {
    console.error('Error in authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
