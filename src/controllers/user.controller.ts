import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadImageToCloudinary } from '../utils/uploadImageToCloudinary';

const prisma = new PrismaClient();

export async function getAllUsers(req: Request, res: Response) {
  const loggedInUserId = (req as any).user.id;

  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: 0, id: { not: loggedInUserId } },
      select: {
        id: true,
        username: true,
        fullname: true,
        avatarImage: true,
        followers: {
          where: { followerId: loggedInUserId },
          select: { followerId: true },
        },
        following: {
          where: { followingId: loggedInUserId },
          select: { followingId: true },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      avatarImage: user.avatarImage,
      isFollowed: user.followers.length > 0,
      isFollowedByTarget: user.following.length > 0,
      followingId: user.id,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    }));

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: formattedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  const userId = (req as any).user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        followers: {
          select: {
            followerId: true,
          },
        },
        following: {
          select: {
            followingId: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      fullname: user.fullname,
      bio: user.bio,
      coverImage: user.coverImage,
      avatarImage: user.avatarImage,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user', error });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { fullname, username, email, bio } = req.body;
  const userId = (req as any).user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const uploadedImages: Record<string, string | null> = {};

    if (req.files) {
      if (Array.isArray(req.files)) {
        uploadedImages['coverImage'] = user.coverImage;
        uploadedImages['avatarImage'] = user.avatarImage;
      } else {
        if (req.files['coverImage']) {
          const coverImageFile = req.files['coverImage'][0];
          uploadedImages['coverImage'] = await uploadImageToCloudinary(
            coverImageFile,
            'circle/profile',
          );
        }
        if (req.files['avatarImage']) {
          const avatarImageFile = req.files['avatarImage'][0];
          uploadedImages['avatarImage'] = await uploadImageToCloudinary(
            avatarImageFile,
            'circle/profile',
          );
        }
      }
    }

    const updatedData: any = {
      fullname,
      username,
      email,
      bio,
      coverImage: uploadedImages['coverImage'] || user.coverImage,
      avatarImage: uploadedImages['avatarImage'] || user.avatarImage,
    };

    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: 'Username or email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      include: {
        followers: true,
        following: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
      followersCount: updatedUser._count.followers,
      followingCount: updatedUser._count.following,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user', error });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const userId = parseInt(req.params.id);

  try {
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId !== (req as any).user.id) {
      return res
        .status(403)
        .json({ message: 'You can only delete your own account' });
    }

    if (userExists.isDeleted === 1) {
      return res.status(400).json({ message: 'User is already deleted' });
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isDeleted: 1,
      },
    });

    res.status(200).json({ message: 'User account has been deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
}
