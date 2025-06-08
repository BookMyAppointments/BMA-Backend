import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from "../emails/verificationMail";
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { generateVerificationCode } from '../utils/helpers';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



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
            address: true,
            picture:true
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
router.get('/documents', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log("User id:", userId);

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: {
        medicalRecord: true
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
      if ('dob' in req.body) updateData.dob = new Date(dob);
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
    console.log(emailResult);
    
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
    const { email, code ,password:newPassword} = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and reset code are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verifyCode?.toLowerCase() !== String(code)) {
      return res.status(400).json({ message: "Invalid Verification Code!!" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

   const updatedUser= await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      }
    });
    return res.status(201).json({message:"Password Updated Succesfully"})
  } catch (error) {
    console.error("Reset code verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/reset-password', authenticateToken,asyncHandler(async (req: Request, res: Response) => {
  try {
    const { originalPassword,newPassword }:{originalPassword:string,newPassword:string} = req.body;
    const id=(req as any).user.id
    
    
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const checkResult=await bcrypt.compare(originalPassword,user.password)
  if(!checkResult){
    return res.status(400).json({ message: "Existing password not matched" });
  }
    await prisma.user.update({
      where:{
        id
      },
      data:{
        password:await bcrypt.hash(newPassword,10)
      }
    })
    
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

    res.status(200).json({ "Message": "Admin role updated for user!" })
  } catch (error) {
    console.error("Error in catch block", error);
    res.status(500).json({ "message": "Internal Server Error!" });
  }
}));

//* verified
router.get("/doctor-route", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "DOCTOR"
      }
    });

    res.status(200).json({ "Message": "Doctor role updated for user!" })
  } catch (error) {
    console.error("Error in catch block", error);
    res.status(500).json({ "message": "Internal Server Error!" });
  }
}));

router.delete('/documents/:documentUrl', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const documentUrl = decodeURIComponent(req.params.documentUrl);

    const user = await prisma.user.findFirst({
      where: { id: userId },
      include: 
{        medicalRecord: {
where:{
  documents:{
    has:documentUrl
  }
}
}
  }});

    if (!user || !user.medicalRecord) {
      return res.status(404).json({ message: "User or medical record not found" });
    }
    
    const updatedDocuments = user.medicalRecord[0].documents.filter(doc => doc !== documentUrl);

    await prisma.medicalRecord.update({
      where: { userId },
      data: {
        documents: updatedDocuments
      }
    });

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

router.post('/google', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture } = payload;

    let user = await prisma.user.findUnique({
      where: { email: email! }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email!,
          name: name!,
          password: '',
          role: 'PATIENT',
          verified: true,
          profile: {
            create: {
              picture: picture
            }
          }
        }
      });
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token: jwtToken
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

//* verified
router.post('/send-verification-code', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userId = (req as any).user.id;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const verifyCode = generateVerificationCode();
    
    // Update current user with new verification code
    await prisma.user.update({
      where: { id: userId },
      data: {
        verifyCode,
        verified: false,
        email 
      }
    });

    const emailResult = await sendVerificationEmail(email, verifyCode, 'signup');
    if (!emailResult.success) {
      // Revert the user update since email sending failed
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: currentUser.email, // Use stored original email
          verified: currentUser.verified, // Use stored original verification status
          verifyCode: null
        }
      });
      return res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }

    res.status(200).json({ message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Send verification code error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}));

export default router;