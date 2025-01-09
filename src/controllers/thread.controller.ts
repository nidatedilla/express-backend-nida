import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadImageToCloudinary } from '../utils/uploadImageToCloudinary';
import { formatDuration } from '../utils/duration';
import { extractPublicIdFromUrl } from '../utils/extractPublicIdFromUrl';
import cloudinary from '../config/cloudinaryConfig';

const prisma = new PrismaClient();

export async function getAllThreads(req: Request, res: Response) {
  const userId = (req as any).user.id;

  try {
    const allThreads = await prisma.thread.findMany({
      skip: 3,
      take:3,
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
            replies: {
              where: {
                isDeleted: 0,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedThreads = await Promise.all(
      allThreads.map(async (thread) => {
        const durationDate = thread.updatedAt || thread.createdAt;
        const duration = formatDuration(durationDate);

        return {
          id: thread.id,
          authorId: thread.authorId,
          content: thread.content,
          image: thread.image,
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
            replies: {
              where: {
                isDeleted: 0,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedThreads = threads.map((thread) => {
      const durationDate = thread.updatedAt || thread.createdAt;
      const duration = formatDuration(durationDate);

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
    });

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
            replies: {
              where: {
                isDeleted: 0,
              },
            },
          },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const threadDate = thread.updatedAt || thread.createdAt;
    const dateObj = new Date(threadDate);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
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

export async function getThreadsByUserId(req: Request, res: Response) {
  const { userId } = req.params;
  const currentUserId = (req as any).user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const threads = await prisma.thread.findMany({
      where: {
        authorId: parseInt(userId),
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
        likes: true,
        _count: {
          select: {
            likes: true,
            replies: {
              where: {
                isDeleted: 0,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!threads || threads.length === 0) {
      return res
        .status(404)
        .json({ message: 'No threads found for this user' });
    }

    const formattedThreads = threads.map((thread) => {
      const durationDate = thread.updatedAt || thread.createdAt;
      const duration = formatDuration(durationDate);

      return {
        id: thread.id,
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
        isLiked: thread.likes.some((like) => like.userId === currentUserId),
      };
    });

    return res.status(200).json({
      message: 'Threads retrieved successfully',
      threads: formattedThreads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving threads', error });
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

    return res.status(201).json({
      message: 'Thread created successfully',
      ...newThread,
      duration: formattedDuration,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating thread', error });
  }
}

export async function updateThread(req: Request, res: Response) {
  const threadId = parseInt(req.params.id);
  const { content } = req.body;
  const userId = (req as any).user.id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (thread.authorId !== userId) {
      return res.status(403).json({
        message: 'User is not authorized to update this thread',
      });
    }

    let newImagePath: string | null = null;
    if (req.files && typeof req.files === 'object') {
      const threadImage = (
        req.files as { [key: string]: Express.Multer.File[] }
      )['image'];

      if (threadImage && threadImage.length > 0) {
        try {
          if (thread.image) {
            const publicId = extractPublicIdFromUrl(thread.image);
            await cloudinary.uploader.destroy(publicId);
          }

          newImagePath = await uploadImageToCloudinary(
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

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        content: content || thread.content,
        image: newImagePath || thread.image,
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
            replies: {
              where: { isDeleted: 0 },
            },
          },
        },
      },
    });

    const formattedDuration = formatDuration(updatedThread.updatedAt);

    res.status(200).json({
      message: 'Thread updated successfully',
      thread: {
        id: updatedThread.id,
        content: updatedThread.content,
        image: updatedThread.image,
        duration: formattedDuration,
        author: {
          id: updatedThread.author.id,
          username: updatedThread.author.username,
          fullname: updatedThread.author.fullname,
          avatarImage: updatedThread.author.avatarImage,
        },
        likesCount: updatedThread._count.likes,
        repliesCount: updatedThread._count.replies,
        isLiked: updatedThread.likes.some((like) => like.userId === userId),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating thread', error });
  }
}

export async function deleteThread(req: Request, res: Response) {
  const threadId = parseInt(req.params.id);

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (thread.authorId !== (req as any).user.id) {
      return res
        .status(401)
        .json({ message: 'User not authorized to delete this thread' });
    }

    if (thread.isDeleted === 1) {
      return res.status(400).json({ message: 'Thread is already deleted' });
    }

    let newImageUrl = null;

    if (thread.image) {
      try {
        const publicId = extractPublicIdFromUrl(thread.image);
        const newPublicId = `circle/delete-thread/${publicId.split('/').pop()}`;
        const result = await cloudinary.uploader.rename(publicId, newPublicId);

        newImageUrl = result.secure_url;
      } catch (error) {
        console.error('Error moving image to delete-thread folder:', error);
        return res.status(500).json({ message: 'Error moving image', error });
      }
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: {
        isDeleted: 1,
        image: newImageUrl || thread.image,
      },
    });

    res.status(200).json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ message: 'Error deleting thread', error });
  }
}
