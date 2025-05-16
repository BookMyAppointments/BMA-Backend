import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv'

dotenv.config();

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  plainText: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainText, hashedPassword);
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatDate = (date: Date | string, format = 'yyyy-MM-dd'): string => {
  const d = new Date(date);
  return format
  .replace('yyyy', d.getFullYear().toString())
  .replace('MM', (d.getMonth() + 1).toString().padStart(2, '0'))
  .replace('dd', d.getDate().toString().padStart(2, '0'));
};


export const generateRandomHex = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

// Helper function to calculate distance between two coordinates 
export const calculateDistance =  (lat1: number, lon1: number, lat2: number, lon2: number): number  => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}