// src/routes/userRoutes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import express from 'express';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from "../emails/verificationMail";
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.use(express.json());

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// User Signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser?.emailVerified) {
      return res.status(400).json({ message: "User already exists! Please login" });
    }

    const verificationCode = generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser && !existingUser.emailVerified) {
      // Update existing unverified user
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          verificationCode,
          name,
          phone
        }
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          verificationCode,
          role: 'USER', // Default role
          emailVerified: false
        }
      });
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    return res.status(201).json({ message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Email Verification
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null
      }
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get User Profile (protected route)
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // req.user is set by the authenticateToken middleware
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Update User Profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true
      }
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Password Reset Request
router.post('/reset-password/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user doesn't exist for security
      return res.status(200).json({ message: "If the email exists, a reset code has been sent" });
    }

    const resetCode = generateVerificationCode();
    const resetCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        resetCode,
        resetCodeExpires
      }
    });

    // In a real app, send the reset code via email
    const emailResult = await sendVerificationEmail(email, resetCode);
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send reset code" });
    }

    return res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Verify Reset Code
router.post('/reset-password/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and reset code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetCode !== code || !user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    return res.status(200).json({ message: "Reset code verified" });
  } catch (error) {
    console.error("Reset code verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, reset code, and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetCode !== code || !user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null
      }
    });

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;