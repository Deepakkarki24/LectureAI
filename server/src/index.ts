import express from "express";
import cors from "cors";
import { MONGODB_URI, NODE_ENV } from "./config/env.js";
import { connectDatabase, connectMongoDBAtlas } from "./config/db.js";

const app = express()
const port = 3000

// db connection
if (NODE_ENV !== "Production") {
    connectDatabase(MONGODB_URI || "")
} else {
    connectMongoDBAtlas()
}

// cors
app.use(
    cors({
        origin: "*",
        credentials: true
    })
)

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// routes
app.router.get("/", (req, res) => {
    return res.send("Server is working!")
})


// running the server on port 3000
app.listen(port, () => {
    try {
        console.log(`Port is running on ${port}`)
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1)
    }
})