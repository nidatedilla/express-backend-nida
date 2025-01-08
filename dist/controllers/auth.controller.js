"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = void 0;
exports.register = register;
exports.login = login;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const SECRET_KEY = process.env.SECRET_KEY || 'vdhag3yeh4bau3rwgrbh';
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
async function register(req, res) {
    const { email, fullname, password, username } = req.body;
    if (!email || !fullname || !password || !username) {
        return res.status(400).json({ message: 'All fields are required!' });
    }
    try {
        const existingUser = await prisma.user.findFirst({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const existingUsername = await prisma.user.findFirst({
            where: { username },
        });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const newUser = await prisma.user.create({
            data: {
                fullname,
                email,
                username,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: 'User registered', user: newUser });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
}
async function login(req, res) {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier, isDeleted: 0 },
                    { email: identifier, isDeleted: 0 },
                ],
            },
            include: {
                followers: {
                    select: {
                        followerId: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (isMatch) {
            const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.status(200).json({
                message: 'Login Successful',
                user: {
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname,
                    username: user.username,
                    avatarImage: user.avatarImage,
                },
                token,
            });
        }
        else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
}
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Email not registered' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await prisma.passwordResetToken.create({
            data: {
                email,
                token: resetToken,
                expiryDate: resetTokenExpiry,
            },
        });
        const transporter = nodemailer_1.default.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: `"Circle Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your Password',
            html: `
        <h3>Hello,</h3>
        <p>You have requested a password reset. Please copy and paste the following link into your browser to reset your password:</p>
        <strong style="color: blue; text-decoration: underline;">${resetLink}</strong>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
        });
        console.log('Reset Link:', resetLink);
        res.status(200).json({ message: 'Password reset email sent' });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: 'An error occurred', error: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const resetTokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
        });
        if (!resetTokenRecord) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        if (new Date() > resetTokenRecord.expiryDate) {
            return res.status(400).json({ message: 'Token expired' });
        }
        const user = await prisma.user.findUnique({
            where: { email: resetTokenRecord.email },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { email: resetTokenRecord.email },
            data: { password: hashedPassword },
        });
        await prisma.passwordResetToken.delete({
            where: { token },
        });
        res.status(200).json({ message: 'Password has been updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};
exports.resetPassword = resetPassword;
