import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from "../emails/verificationMail";
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { generateVerificationCode } from '../utils/helpers';

const router = Router();

//* verified
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser?.verified) {
      return res.status(400).json({ message: "User already exists! Please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyCode = generateVerificationCode();

    if (existingUser && !existingUser.verified) {
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          verifyCode,
          name,
          phone
        }
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          verifyCode,
          role: 'PATIENT',
          verified: false
        }
      });
    }

    const emailResult = await sendVerificationEmail(email, verifyCode, 'signup');
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    res.status(201).json({ message: "User registered successfully! Please check your email for verification." });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
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

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.verifyCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user as verified
    await prisma.user.update({
      where: { email },
      data: {
        verified: true,
        verifyCode: null
      }
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/signin', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "User does not exist!!" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

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
}));

//* verified
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log("User id:", userId);

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        profile: {
          select: {
            id: true,
            userId: true,
            gender: true,
            dob: true,
            address: true
          }
        }
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
}));

//* verified
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, phone, dob, gender, address } = req.body;

    console.log("User id:", userId);

    if (!name && !phone && !dob && !gender && !address) {
      return res.status(400).json({ message: "At least one field is required for update" });
    }

    if (Object.keys(req.body).some(key => ['name', 'phone'].includes(key))) {
      const updateData: any = {};
      if ('name' in req.body) updateData.name = name;
      if ('phone' in req.body) updateData.phone = phone;

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    if (Object.keys(req.body).some(key => ['dob', 'gender', 'address'].includes(key))) {
      const updateData: any = {};
      if ('dob' in req.body) updateData.dob = dob;
      if ('gender' in req.body) updateData.gender = gender;
      if ('address' in req.body) updateData.address = address;

      await prisma.profile.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData
        }
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/reset-password/request', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(200).json({ message: "If the email exists, a reset code has been sent" });
    }

    const resetCode = generateVerificationCode();

    await prisma.user.update({
      where: { email },
      data: {
        verifyCode: resetCode,
      }
    });

    const emailResult = await sendVerificationEmail(email, resetCode, 'reset');
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send reset code" });
    }

    return res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/reset-password/verify', asyncHandler(async (req: Request, res: Response) => {
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

    if (user.verifyCode !== code) {
      return res.status(400).json({ message: "Invalid Verification Code!!" });
    }

    return res.status(200).json({ message: "Reset code verified" });
  } catch (error) {
    console.error("Reset code verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email, reset code, and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      }
    });

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.get("/admin-route", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "ADMIN"
      }
    });

    res.status(200).json({"Message" : "Admin role updated for user!"})
  } catch (error) {
    console.error("Error in catch block", error);
    res.status(500).json({ "message": "Internal Server Error!" });
  }
}))

export default router;