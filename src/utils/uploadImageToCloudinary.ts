import cloudinary from "../config/cloudinaryConfig";

export async function uploadImageToCloudinary(file: Express.Multer.File, folder: string) {
  try {
    const base64Image = file.buffer.toString('base64');
    const imageData = `data:${file.mimetype};base64,${base64Image}`;
    const result = await cloudinary.uploader.upload(imageData, {
      resource_type: 'auto',
      folder,
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Error uploading image');
  }
}
