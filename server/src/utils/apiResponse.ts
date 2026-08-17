import type { Response } from "express"


export const successResponse = (
    res: Response,
    statusCode: number,
    message: string,
    data?: any
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data: data || null
    })
}

export const errorResponse = (
    res: Response,
    statusCode: number,
    message: string,
    error?: any
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error: error || null
    })
}