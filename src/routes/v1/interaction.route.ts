import express from 'express';
import { authentication } from '../../middlewares/authentication';
import {
  createReply,
  deleteReply,
  getThreadReplies,
  toggleFollow,
  toggleLike,
  toggleReplyLike,
} from '../../controllers/interaction.controller';
import { upload } from '../../middlewares/upload-file';

const interactionRoute = express.Router();

interactionRoute.post('/like/:threadId', authentication, toggleLike);
interactionRoute.post('/follow/:followingId', authentication, toggleFollow);
interactionRoute.get('/replies/:threadId', authentication, getThreadReplies);
interactionRoute.post('/reply/:threadId', authentication, upload, createReply);
interactionRoute.post('/reply/like/:replyId', authentication, toggleReplyLike);
interactionRoute.delete('/reply/:replyId', authentication, deleteReply);

export default interactionRoute;
