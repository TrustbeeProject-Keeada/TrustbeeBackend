import dotenv from "dotenv";
import { createApp } from "./app";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URL = process.env.MONGO_URL ?? "mongodb://localhost:27017/myapp";

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.info("DB CONNECTED (MongoDB)");

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB NOT CONNECTED (MongoDB)", error);
    process.exit(1);
  }
};

startServer();
