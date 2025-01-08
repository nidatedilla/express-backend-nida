import express from 'express';
import {
  createThread,
  deleteThread,
  getAllThreads,
  getThreadById,
  getThreadsByUser,
  getThreadsByUserId,
  updateThread,
} from '../../controllers/thread.controller';
import { authentication } from '../../middlewares/authentication';
import { upload } from '../../middlewares/upload-file';

const threadRoute = express.Router();

threadRoute.get('/', authentication, getAllThreads);
threadRoute.get('/user', authentication, getThreadsByUser);
threadRoute.get('/:id', authentication, getThreadById);
threadRoute.get('/user/:userId', authentication, getThreadsByUserId);
threadRoute.post('/', authentication, upload, createThread);
threadRoute.post('/:id', authentication, upload, updateThread);
threadRoute.delete('/:id', authentication, deleteThread);

export default threadRoute;
