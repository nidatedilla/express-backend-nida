import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { formatDuration } from '../utils/duration';
import { uploadImageToCloudinary } from '../utils/uploadImageToCloudinary';

export async function toggleLike(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId);
  const userId = (req as any).user.id;

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId, isDeleted: 0 },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const existingLike = await prisma.like.findUnique({
      where: { threadId_userId: { threadId, userId } },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { threadId_userId: { threadId, userId } },
      });
      return res.status(200).json({ message: 'Like removed' });
    }

    await prisma.like.create({ data: { threadId, userId } });

    const likesCount = await prisma.like.count({
      where: { threadId },
    });

    const isLiked =
      (await prisma.like.findUnique({
        where: { threadId_userId: { threadId, userId } },
      })) !== null;

    const userWhoLiked = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullname: true,
        avatarImage: true,
      },
    });

    res.status(201).json({
      message: existingLike ? 'Like removed' : 'Like added',
      isLiked,
      likesCount,
      user: userWhoLiked,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error toggling like', error });
  }
}

export async function toggleFollow(req: Request, res: Response) {
  const followingId = parseInt(req.params.followingId);
  const followerId = (req as any).user.id;

  try {
    if (followingId === followerId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId, isDeleted: 0 },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: followingId,
          },
        },
      });
      return res.status(200).json({ message: 'Unfollowed successfully' });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    res.status(201).json({ message: 'Followed successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error toggling follow', error });
  }
}

export async function createReply(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId);
  const userId = (req as any).user.id;
  const { content } = req.body;
  const createdAt = new Date();

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  let imagePath: string | null = null;

  if (req.files && typeof req.files === 'object') {
    const replyImage = (req.files as { [key: string]: Express.Multer.File[] })[
      'image'
    ];

    if (replyImage && replyImage.length > 0) {
      try {
        imagePath = await uploadImageToCloudinary(
          replyImage[0],
          'circle/reply',
        );
      } catch (error) {
        return res
          .status(500)
          .json({ message: 'Error uploading image to Cloudinary', error });
      }
    }
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId, isDeleted: 0 },
    });

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const newReply = await prisma.reply.create({
      data: {
        content,
        threadId,
        userId,
        createdAt,
        image: imagePath,
      },
    });

    const formattedDuration = formatDuration(createdAt);

    return res.status(201).json({
      message: 'Reply created successfully',
      ...newReply,
      duration: formattedDuration,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating reply', error });
  }
}

export async function toggleReplyLike(req: Request, res: Response) {
  const replyId = parseInt(req.params.replyId);
  const userId = (req as any).user.id;

  try {
    const reply = await prisma.reply.findUnique({
      where: { id: replyId, isDeleted: 0 },
    });

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const existingLike = await prisma.replyLike.findUnique({
      where: { replyId_userId: { replyId, userId } },
    });

    if (existingLike) {
      await prisma.replyLike.delete({
        where: { replyId_userId: { replyId, userId } },
      });
      return res.status(200).json({ message: 'Reply like removed' });
    }

    await prisma.replyLike.create({ data: { replyId, userId } });

    res.status(201).json({ message: 'Reply like successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling reply like', error });
  }
}

export async function getThreadReplies(req: Request, res: Response) {
  const threadId = parseInt(req.params.threadId);

  try {
    const replies = await prisma.reply.findMany({
      where: { threadId: threadId, isDeleted: 0 },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedReplies = replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      image:reply.image,
      createdAt: reply.createdAt,
      duration: formatDuration(reply.createdAt),
      author: {
        id: reply.user.id,
        username: reply.user.username,
        fullname: reply.user.fullname,
        avatarImage: reply.user.avatarImage,
      },
      likesCount: reply._count.likes,
    }));
    res.status(200).json({
      message: 'Replies retrieved successfully',
      replies: formattedReplies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting replies', error });
  }
}
