"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const verificationMail_1 = require("../emails/verificationMail");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const helpers_1 = require("../utils/helpers");
const router = (0, express_1.Router)();
router.post('/signup', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password, and name are required" });
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser?.verified) {
            return res.status(400).json({ message: "User already exists! Please login" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const verifyCode = (0, helpers_1.generateVerificationCode)();
        if (existingUser && !existingUser.verified) {
            await prisma_1.prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    verifyCode,
                    name,
                    phone
                }
            });
        }
        else {
            await prisma_1.prisma.user.create({
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
        const emailResult = await (0, verificationMail_1.sendVerificationEmail)(email, verifyCode);
        if (!emailResult.success) {
            return res.status(500).json({ message: "Failed to send verification email" });
        }
        res.status(201).json({ message: "User registered successfully! Please check your email for verification." });
    }
    catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.post('/verify', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: "Email and verification code are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
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
        await prisma_1.prisma.user.update({
            where: { email },
            data: {
                verified: true,
                verifyCode: null
            }
        });
        return res.status(200).json({ message: "Email verified successfully" });
    }
    catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.post('/signin', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ message: "User does not exist!!" });
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({
            message: "Login successful",
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.get('/profile', authMiddleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.put('/profile', authMiddleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone } = req.body;
        const updatedUser = await prisma_1.prisma.user.update({
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
    }
    catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.post('/reset-password/request', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(200).json({ message: "If the email exists, a reset code has been sent" });
        }
        const resetCode = (0, helpers_1.generateVerificationCode)();
        await prisma_1.prisma.user.update({
            where: { email },
            data: {
                verifyCode: resetCode,
            }
        });
        const emailResult = await (0, verificationMail_1.sendVerificationEmail)(email, resetCode);
        if (!emailResult.success) {
            return res.status(500).json({ message: "Failed to send reset code" });
        }
        return res.status(200).json({ message: "Reset code sent to your email" });
    }
    catch (error) {
        console.error("Password reset request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.post('/reset-password/verify', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: "Email and reset code are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.verifyCode !== code) {
            return res.status(400).json({ message: "Invalid Verification Code!!" });
        }
        return res.status(200).json({ message: "Reset code verified" });
    }
    catch (error) {
        console.error("Reset code verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
router.post('/reset-password', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email, reset code, and new password are required" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            }
        });
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Password reset error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
exports.default = router;
