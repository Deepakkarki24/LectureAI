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

export const uploadImageToCloudinary = (
    buffer: Buffer,
    publicId: string
): Promise<{ secure_url: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                public_id: publicId,
                folder: "lectures",
                format: "png",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (!result?.secure_url) {
                    reject(new Error("Cloudinary image upload returned no URL"));
                    return;
                }
                resolve({ secure_url: result.secure_url });
            }
        );

        uploadStream.end(buffer);
    });
};