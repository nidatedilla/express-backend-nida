import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();

const uploadMiddleware = multer({ storage }).fields([
  { name: 'avatarImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

export function upload(req: Request, res: Response, next: NextFunction) {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}
