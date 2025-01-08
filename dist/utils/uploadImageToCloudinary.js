"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToCloudinary = uploadImageToCloudinary;
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
async function uploadImageToCloudinary(file, folder) {
    try {
        const base64Image = file.buffer.toString('base64');
        const imageData = `data:${file.mimetype};base64,${base64Image}`;
        const result = await cloudinaryConfig_1.default.uploader.upload(imageData, {
            resource_type: 'auto',
            folder,
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Error uploading image');
    }
}
