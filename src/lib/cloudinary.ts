import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = multer.memoryStorage();
const imageUploadUtil = async (fileBuffer: Buffer, mimetype: string) => {
  const base64 = fileBuffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "auto",
  });

  return result;
};


const upload = multer({ storage });

export default { upload, imageUploadUtil };