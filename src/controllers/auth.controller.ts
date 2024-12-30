import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
          avatarImage:user.avatarImage,
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
