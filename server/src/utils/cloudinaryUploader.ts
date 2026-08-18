import cloudinary from "@/config/cloudinary.config.js";

export const uploadAudioToCloudinary = (
    buffer: Buffer,
    publicId: string
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video",
                public_id: publicId,
                folder: "audio",
                format: "mp3",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
};