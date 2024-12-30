import express from 'express';
import {
  createThread,
  deleteThread,
  getAllThreads,
  getThreadById,
  getThreadsByUser,
} from '../../controllers/thread.controller';
import { authentication } from '../../middlewares/authentication';
import { upload } from '../../middlewares/upload-file';

const threadRoute = express.Router();

threadRoute.get('/', authentication, getAllThreads);
threadRoute.get('/user', authentication, getThreadsByUser);
threadRoute.get("/:id", authentication, getThreadById)
threadRoute.post('/', authentication, upload, createThread);
threadRoute.delete('/:id', authentication, deleteThread);

export default threadRoute;
