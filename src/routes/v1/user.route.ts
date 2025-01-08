import express from 'express';
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getUserById,
  updateUser,
} from '../../controllers/user.controller';
import { authentication } from '../../middlewares/authentication';
import { upload } from '../../middlewares/upload-file';

const userRoute = express.Router();

userRoute.get('/all', authentication, getAllUsers);
userRoute.get('/', authentication, getCurrentUser);
userRoute.get('/:id', authentication, getUserById);
userRoute.put('/', authentication, upload, updateUser);
userRoute.delete('/', authentication, deleteUser);

export default userRoute;
