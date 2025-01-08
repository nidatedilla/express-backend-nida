"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const uploadMiddleware = (0, multer_1.default)({ storage }).fields([
    { name: 'avatarImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]);
function upload(req, res, next) {
    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError || err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}
