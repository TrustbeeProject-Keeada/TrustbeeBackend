import dotenv from "dotenv";
import { createApp } from "./app.js";
import { startCronJobs } from "./utils/cronJobs.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.info("DB CONNECTED");

    const app = createApp();

    startCronJobs();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB NOT CONNECTED", error);
    process.exit(1);
  }
};

startServer();
