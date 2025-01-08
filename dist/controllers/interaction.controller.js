"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLike = toggleLike;
exports.toggleFollow = toggleFollow;
exports.createReply = createReply;
exports.toggleReplyLike = toggleReplyLike;
exports.getThreadReplies = getThreadReplies;
exports.deleteReply = deleteReply;
const prisma_1 = __importDefault(require("../utils/prisma"));
const duration_1 = require("../utils/duration");
const uploadImageToCloudinary_1 = require("../utils/uploadImageToCloudinary");
const extractPublicIdFromUrl_1 = require("../utils/extractPublicIdFromUrl");
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
async function toggleLike(req, res) {
    const threadId = parseInt(req.params.threadId);
    const userId = req.user.id;
    try {
        const thread = await prisma_1.default.thread.findUnique({
            where: { id: threadId, isDeleted: 0 },
        });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        const existingLike = await prisma_1.default.like.findUnique({
            where: { threadId_userId: { threadId, userId } },
        });
        if (existingLike) {
            await prisma_1.default.like.delete({
                where: { threadId_userId: { threadId, userId } },
            });
            return res.status(200).json({ message: 'Like removed' });
        }
        await prisma_1.default.like.create({ data: { threadId, userId } });
        const likesCount = await prisma_1.default.like.count({
            where: { threadId },
        });
        const isLiked = (await prisma_1.default.like.findUnique({
            where: { threadId_userId: { threadId, userId } },
        })) !== null;
        const userWhoLiked = await prisma_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling like', error });
    }
}
async function toggleFollow(req, res) {
    const followingId = parseInt(req.params.followingId);
    const followerId = req.user.id;
    try {
        if (followingId === followerId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: followingId, isDeleted: 0 },
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const existingFollow = await prisma_1.default.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: followingId,
                },
            },
        });
        if (existingFollow) {
            await prisma_1.default.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: followerId,
                        followingId: followingId,
                    },
                },
            });
            return res.status(200).json({ message: 'Unfollowed successfully' });
        }
        await prisma_1.default.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
        res.status(201).json({ message: 'Followed successfully' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error toggling follow', error });
    }
}
async function createReply(req, res) {
    const threadId = parseInt(req.params.threadId);
    const userId = req.user.id;
    const { content } = req.body;
    const createdAt = new Date();
    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }
    let imagePath = null;
    if (req.files && typeof req.files === 'object') {
        const replyImage = req.files['image'];
        if (replyImage && replyImage.length > 0) {
            try {
                imagePath = await (0, uploadImageToCloudinary_1.uploadImageToCloudinary)(replyImage[0], 'circle/reply');
            }
            catch (error) {
                return res
                    .status(500)
                    .json({ message: 'Error uploading image to Cloudinary', error });
            }
        }
    }
    try {
        const thread = await prisma_1.default.thread.findUnique({
            where: { id: threadId, isDeleted: 0 },
        });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        const newReply = await prisma_1.default.reply.create({
            data: {
                content,
                threadId,
                userId,
                createdAt,
                image: imagePath,
            },
        });
        const formattedDuration = (0, duration_1.formatDuration)(createdAt);
        return res.status(201).json({
            message: 'Reply created successfully',
            ...newReply,
            authorId: userId,
            duration: formattedDuration,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating reply', error });
    }
}
async function toggleReplyLike(req, res) {
    const replyId = parseInt(req.params.replyId);
    const userId = req.user.id;
    try {
        const reply = await prisma_1.default.reply.findUnique({
            where: { id: replyId, isDeleted: 0 },
        });
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        const existingLike = await prisma_1.default.replyLike.findUnique({
            where: { replyId_userId: { replyId, userId } },
        });
        if (existingLike) {
            await prisma_1.default.replyLike.delete({
                where: { replyId_userId: { replyId, userId } },
            });
            const likesCount = await prisma_1.default.replyLike.count({
                where: { replyId },
            });
            return res.status(200).json({
                message: 'Reply like removed',
                isLiked: false,
                likesCount,
            });
        }
        await prisma_1.default.replyLike.create({ data: { replyId, userId } });
        const likesCount = await prisma_1.default.replyLike.count({
            where: { replyId },
        });
        const isLiked = (await prisma_1.default.replyLike.findUnique({
            where: { replyId_userId: { replyId, userId } },
        })) !== null;
        res.status(201).json({
            message: 'Reply like added',
            isLiked,
            likesCount,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error toggling reply like', error });
    }
}
async function getThreadReplies(req, res) {
    const threadId = parseInt(req.params.threadId);
    const userId = req.user.id;
    try {
        const replies = await prisma_1.default.reply.findMany({
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
                likes: {
                    where: { userId },
                    select: { userId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formattedReplies = replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            image: reply.image,
            createdAt: reply.createdAt,
            duration: (0, duration_1.formatDuration)(reply.createdAt),
            author: {
                id: reply.user.id,
                username: reply.user.username,
                fullname: reply.user.fullname,
                avatarImage: reply.user.avatarImage,
            },
            likesCount: reply._count.likes,
            isLiked: reply.likes.some((like) => like.userId === userId),
        }));
        res.status(200).json({
            message: 'Replies retrieved successfully',
            replies: formattedReplies,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting replies', error });
    }
}
async function deleteReply(req, res) {
    const replyId = parseInt(req.params.replyId);
    const userId = req.user.id;
    try {
        const reply = await prisma_1.default.reply.findUnique({
            where: { id: replyId },
        });
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        const thread = await prisma_1.default.thread.findUnique({
            where: { id: reply.threadId },
        });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        if (reply.userId !== userId && thread.authorId !== userId) {
            return res.status(401).json({ message: 'User not authorized to delete this reply' });
        }
        let newImageUrl = null;
        if (reply.image) {
            try {
                const publicId = (0, extractPublicIdFromUrl_1.extractPublicIdFromUrl)(reply.image);
                const newPublicId = `circle/delete-reply/${publicId.split('/').pop()}`;
                const result = await cloudinaryConfig_1.default.uploader.rename(publicId, newPublicId);
                newImageUrl = result.secure_url;
            }
            catch (error) {
                console.error('Error moving image to delete-reply folder:', error);
                return res.status(500).json({ message: 'Error moving image', error });
            }
        }
        await prisma_1.default.reply.update({
            where: { id: replyId },
            data: {
                isDeleted: 1,
                image: newImageUrl || reply.image,
            },
        });
        res.status(200).json({ message: 'Reply deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting reply:', error);
        res.status(500).json({ message: 'Error deleting reply', error });
    }
}
