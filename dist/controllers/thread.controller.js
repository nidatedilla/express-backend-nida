"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllThreads = getAllThreads;
exports.getThreadsByUser = getThreadsByUser;
exports.getThreadById = getThreadById;
exports.getThreadsByUserId = getThreadsByUserId;
exports.createThread = createThread;
exports.updateThread = updateThread;
exports.deleteThread = deleteThread;
const client_1 = require("@prisma/client");
const uploadImageToCloudinary_1 = require("../utils/uploadImageToCloudinary");
const duration_1 = require("../utils/duration");
const extractPublicIdFromUrl_1 = require("../utils/extractPublicIdFromUrl");
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
const prisma = new client_1.PrismaClient();
async function getAllThreads(req, res) {
    const userId = req.user.id;
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
        const formattedThreads = await Promise.all(allThreads.map(async (thread) => {
            const durationDate = thread.updatedAt || thread.createdAt;
            const duration = (0, duration_1.formatDuration)(durationDate);
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
        }));
        res.status(200).json({
            message: 'Get all threads successful',
            threads: formattedThreads,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching all threads', error });
    }
}
async function getThreadsByUser(req, res) {
    const userId = req.user.id;
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
            const duration = (0, duration_1.formatDuration)(durationDate);
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving threads', error });
    }
}
async function getThreadById(req, res) {
    const threadId = parseInt(req.params.id);
    const userId = req.user.id;
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching thread', error });
    }
}
async function getThreadsByUserId(req, res) {
    const { userId } = req.params;
    const currentUserId = req.user.id;
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
            const duration = (0, duration_1.formatDuration)(durationDate);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving threads', error });
    }
}
async function createThread(req, res) {
    const { content } = req.body;
    const createdAt = new Date();
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }
    let imagePath = null;
    if (req.files && typeof req.files === 'object') {
        const threadImage = req.files['image'];
        if (threadImage && threadImage.length > 0) {
            try {
                imagePath = await (0, uploadImageToCloudinary_1.uploadImageToCloudinary)(threadImage[0], 'circle/thread');
            }
            catch (error) {
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
        const formattedDuration = (0, duration_1.formatDuration)(createdAt);
        return res.status(201).json({
            message: 'Thread created successfully',
            ...newThread,
            duration: formattedDuration,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating thread', error });
    }
}
async function updateThread(req, res) {
    const threadId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.id;
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
        let newImagePath = null;
        if (req.files && typeof req.files === 'object') {
            const threadImage = req.files['image'];
            if (threadImage && threadImage.length > 0) {
                try {
                    if (thread.image) {
                        const publicId = (0, extractPublicIdFromUrl_1.extractPublicIdFromUrl)(thread.image);
                        await cloudinaryConfig_1.default.uploader.destroy(publicId);
                    }
                    newImagePath = await (0, uploadImageToCloudinary_1.uploadImageToCloudinary)(threadImage[0], 'circle/thread');
                }
                catch (error) {
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
        const formattedDuration = (0, duration_1.formatDuration)(updatedThread.updatedAt);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating thread', error });
    }
}
async function deleteThread(req, res) {
    const threadId = parseInt(req.params.id);
    try {
        const thread = await prisma.thread.findUnique({
            where: { id: threadId },
        });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        if (thread.authorId !== req.user.id) {
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
                const publicId = (0, extractPublicIdFromUrl_1.extractPublicIdFromUrl)(thread.image);
                const newPublicId = `circle/delete-thread/${publicId.split('/').pop()}`;
                const result = await cloudinaryConfig_1.default.uploader.rename(publicId, newPublicId);
                newImageUrl = result.secure_url;
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ message: 'Error deleting thread', error });
    }
}
