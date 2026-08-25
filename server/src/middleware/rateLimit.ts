import rateLimit from "express-rate-limit";

export const pdfExtractionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20,                // 20 requests per 15 minutes
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message: "aiLimiter: Too many PDF extraction requests. Please try again later.",
    },
});

export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hours
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message: "aiLimiter: Too many requests. Please try again later.",
    },
});