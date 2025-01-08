"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicIdFromUrl = extractPublicIdFromUrl;
function extractPublicIdFromUrl(imageUrl) {
    const urlParts = imageUrl.split('/');
    const circleIndex = urlParts.findIndex(part => part === 'circle');
    if (circleIndex === -1 || circleIndex + 2 >= urlParts.length) {
        throw new Error('Invalid Cloudinary URL format');
    }
    const folder = urlParts[circleIndex + 1];
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];
    return `circle/${folder}/${publicId}`;
}
