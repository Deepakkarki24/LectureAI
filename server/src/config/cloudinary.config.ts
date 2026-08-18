import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_SECRET_KEY } from "./env.js";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME || '',
    api_key: CLOUDINARY_API_KEY || '',
    api_secret: CLOUDINARY_SECRET_KEY || '',
});

export default cloudinary;