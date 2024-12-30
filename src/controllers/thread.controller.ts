import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadImageToCloudinary } from '../utils/uploadImageToCloudinary';
import { formatDuration } from '../utils/duration';

const prisma = new PrismaClient();

export async function getAllThreads(req: Request, res: Response) {
  const userId = (req as any).user.id;

  try {
    const allThreads = await prisma.thread.findMany({
      where: {
        isDeleted: 0,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarImage: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedThreads = await Promise.all(
      allThreads.map(async (thread) => {
        const duration = formatDuration(thread.createdAt);

        return {
          id: thread.id,
          authorId: thread.authorId,
          content: thread.content,
          image: thread.image,
          createdAt: thread.createdAt,
          duration,
          author: {
            id: thread.author.id,
            username: thread.author.username,
            fullname: thread.author.fullname,
            avatarImage: thread.author.avatarImage,
          },
          likesCount: thread._count.likes,
          repliesCount: thread._count.replies,
          isLiked: thread.likes.some((like) => like.userId === userId),
        };
      }),
    );

    res.status(200).json({
      message: 'Get all threads successful',
      threads: formattedThreads,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all threads', error });
  }
}

export async function getThreadsByUser(req: Request, res: Response) {
  const userId = (req as any).user.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const threads = await prisma.thread.findMany({
      where: { authorId: userId, isDeleted: 0 },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarImage: true,
          },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            replies: true, 
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedThreads = threads.map((thread) => ({
      id: thread.id,
      authorId: thread.authorId,
      content: thread.content,
      image: thread.image,
      createdAt: thread.createdAt,
      duration: formatDuration(thread.createdAt),
      author: {
        id: thread.author.id,
        username: thread.author.username,
        fullname: thread.author.fullname,
        avatarImage: thread.author.avatarImage,
      },
      likesCount: thread._count.likes,
      repliesCount: thread._count.replies,
      isLiked: thread.likes.some((like) => like.userId === userId),
    }));

    res.status(200).json({
      message: 'Threads retrieved successfully',
      threads: formattedThreads,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving threads', error });
  }
}

export async function getThreadById(req: Request, res: Response) {
  const threadId = parseInt(req.params.id);
  const userId = (req as any).user.id;

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId, isDeleted: 0 },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarImage: true,
          },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const createdAtDate = new Date(thread.createdAt);
    const formattedDate = createdAtDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = createdAtDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    res.status(200).json({
      id: thread.id,
      content: thread.content,
      image: thread.image,
      createdAt: {
        date: formattedDate,
        time: formattedTime,
      },
      author: {
        id: thread.author.id,
        username: thread.author.username,
        fullname: thread.author.fullname,
        avatarImage: thread.author.avatarImage,
      },
      likesCount: thread._count.likes,
      repliesCount: thread._count.replies,
      isLiked: thread.likes.some((like) => like.userId === userId),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching thread', error });
  }
}

export async function createThread(req: Request, res: Response) {
  const { content } = req.body;
  const createdAt = new Date();
  const userId = (req as any).user.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  let imagePath: string | null = null;

  if (req.files && typeof req.files === 'object') {
    const threadImage = (req.files as { [key: string]: Express.Multer.File[] })[
      'image'
    ];

    if (threadImage && threadImage.length > 0) {
      try {
        imagePath = await uploadImageToCloudinary(
          threadImage[0],
          'circle/thread',
        );
      } catch (error) {
        return res
          .status(500)
          .json({ message: 'Error uploading image to Cloudinary', error });
      }
    }
  }

  try {
    const newThread = await prisma.thread.create({
      data: {
        content,
        authorId: userId,
        image: imagePath,
        createdAt,
      },
    });

    const formattedDuration = formatDuration(createdAt);

    return res.status(201).json({message: 'Thread created successfully',
      ...newThread,
      duration: formattedDuration,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating thread', error });
  }
}

export async function deleteThread(req: Request, res: Response) {
  const threadId = parseInt(req.params.id);

  try {
    const threadExists = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!threadExists) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (threadExists.authorId !== (req as any).user.id) {
      return res
        .status(401)
        .json({ message: 'User not granted to delete this thread' });
    }

    if (threadExists.isDeleted === 1) {
      return res.status(400).json({ message: 'Thread is already deleted' });
    }

    await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        isDeleted: 1,
      },
    });

    res.status(200).json({ message: 'Thread deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting thread', error });
  }
}
