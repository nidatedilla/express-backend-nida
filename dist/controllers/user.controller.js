"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getCurrentUser = getCurrentUser;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const client_1 = require("@prisma/client");
const uploadImageToCloudinary_1 = require("../utils/uploadImageToCloudinary");
const extractPublicIdFromUrl_1 = require("../utils/extractPublicIdFromUrl");
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
const prisma = new client_1.PrismaClient();
async function getAllUsers(req, res) {
    const loggedInUserId = req.user.id;
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users', error });
    }
}
async function getCurrentUser(req, res) {
    const userId = req.user.id;
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user', error });
    }
}
async function getUserById(req, res) {
    const id = parseInt(req.params.id);
    const userId = req.user.id;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                followers: {
                    where: { followerId: userId },
                    select: {
                        followerId: true,
                    },
                },
                following: {
                    where: { followingId: userId },
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
            isFollowed: user.followers.length > 0,
            isFollowedByTarget: user.following.length > 0,
            followersCount: user._count.followers,
            followingCount: user._count.following,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user', error });
    }
}
async function updateUser(req, res) {
    const { fullname, username, email, bio } = req.body;
    const userId = req.user.id;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const uploadedImages = {};
        if (req.files) {
            if (Array.isArray(req.files)) {
                uploadedImages['coverImage'] = user.coverImage;
                uploadedImages['avatarImage'] = user.avatarImage;
            }
            else {
                if (req.files['coverImage']) {
                    const coverImageFile = req.files['coverImage'][0];
                    if (user.coverImage) {
                        const publicId = (0, extractPublicIdFromUrl_1.extractPublicIdFromUrl)(user.coverImage);
                        await cloudinaryConfig_1.default.uploader.destroy(publicId);
                    }
                    uploadedImages['coverImage'] = await (0, uploadImageToCloudinary_1.uploadImageToCloudinary)(coverImageFile, 'circle/profile');
                }
                if (req.files['avatarImage']) {
                    const avatarImageFile = req.files['avatarImage'][0];
                    if (user.avatarImage) {
                        const publicId = (0, extractPublicIdFromUrl_1.extractPublicIdFromUrl)(user.avatarImage);
                        await cloudinaryConfig_1.default.uploader.destroy(publicId);
                    }
                    uploadedImages['avatarImage'] = await (0, uploadImageToCloudinary_1.uploadImageToCloudinary)(avatarImageFile, 'circle/profile');
                }
            }
        }
        const updatedData = {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user', error });
    }
}
async function deleteUser(req, res) {
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
        if (userId !== req.user.id) {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
}
