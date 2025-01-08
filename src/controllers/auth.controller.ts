import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const SECRET_KEY = process.env.SECRET_KEY || 'vdhag3yeh4bau3rwgrbh';
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
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

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        fullname,
        email,
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: 'User registered', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
}

export async function login(req: Request, res: Response) {
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: '1h' },
      );
      res.status(200).json({
        message: 'Login Successful',
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          username:user.username,
          avatarImage: user.avatarImage,
        },
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expiryDate: resetTokenExpiry,
      },
    });

    const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred', error: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: resetTokenRecord.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    res.status(200).json({ message: 'Password has been updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred', error });
  }
};
