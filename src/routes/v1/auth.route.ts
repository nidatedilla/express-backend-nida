import express from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
} from '../../controllers/auth.controller';

const authRoute = express.Router();

authRoute.post('/register', register);
authRoute.post('/login', login);
authRoute.post('/forgot-password', forgotPassword);
authRoute.post('/reset-password', resetPassword);

export default authRoute;
