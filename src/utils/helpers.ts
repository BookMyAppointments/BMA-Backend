// src/utils/helpers.ts
import { env } from './env';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Cryptographic Utilities
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  plainText: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainText, hashedPassword);
};

export const generateRandomHex = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * JWT Utilities
 */
type JwtPayload = {
  userId: string;
  [key: string]: any;
};

export const generateJwt = (payload: JwtPayload, expiresIn = '7d'): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
};

export const verifyJwt = <T extends JwtPayload>(token: string): T | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as T;
  } catch {
    return null;
  }
};

/**
 * MongoDB Utilities
 */
export const toObjectId = (id: string | ObjectId): ObjectId => {
  return typeof id === 'string' ? new ObjectId(id) : id;
};

export const isValidObjectId = (id: string): boolean => {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

/**
 * Date Utilities
 */
export const formatDate = (date: Date | string, format = 'yyyy-MM-dd'): string => {
  const d = new Date(date);
  return format
    .replace('yyyy', d.getFullYear().toString())
    .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
    .replace('dd', d.getDate().toString().padStart(2, '0'));
};

/**
 * Error Handling Utilities
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
  }
}

export const asyncHandler = <T extends any[]>(
  fn: (...args: T) => Promise<any>
) => {
  return (...args: T) => fn(...args).catch(args[2]); // args[2] is next() in Express
};