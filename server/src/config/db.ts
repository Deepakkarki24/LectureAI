import mongoose from "mongoose";
import { MONGODB_PASSWORD, MONGODB_USERNAME } from "./env.js";


export const connectDatabase = async (uri: string) => {
    if (!uri) {
        throw new Error("MONGODB_URI is not defined");
    }
    await mongoose.connect(uri);
    console.log("DB is connected");
};

export const connectMongoDBAtlas = async () => {
    try {
        const username = encodeURIComponent(MONGODB_USERNAME || "");
        const password = encodeURIComponent(MONGODB_PASSWORD || "");
        const uri = `mongodb+srv://${username}:${password}@cluster0.ugyic8h.mongodb.net/simp`;
        await mongoose.connect(uri);

        console.log("Connected to MongoDB Atlas with Mongoose");
    } catch (error) {
        console.error(" MongoDB Atlas connection error:", error);
        process.exit(1);
    }
}