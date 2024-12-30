import express from 'express';
import { authentication } from '../../middlewares/authentication';
import {
  createReply,
  getThreadReplies,
  toggleFollow,
  toggleLike,
  toggleReplyLike,
} from '../../controllers/interaction.controller';
import { upload } from '../../middlewares/upload-file';

const interactionRoute = express.Router();

interactionRoute.post('/like/:threadId', authentication, toggleLike);
interactionRoute.post('/reply/like/:replyId', authentication, toggleReplyLike);
interactionRoute.post('/follow/:followingId', authentication, toggleFollow);
interactionRoute.post('/reply/:threadId', authentication, upload, createReply);
interactionRoute.get('/replies/:threadId', authentication, getThreadReplies);

export default interactionRoute;
