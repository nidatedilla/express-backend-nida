import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SECRET_KEY = process.env.SECRET_KEY || 'vdhag3yeh4bau3rwgrbh';

export async function authentication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      id: number;
      username: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        isDeleted: 0,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Account has been deleted or invalid token',
      });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
