import cron from "node-cron";
import { cleanUpOldArchivedJobsService } from "../services/job.service.js";

export const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    // This means the job will run every day at midnight (00:00)
    console.log("[CRON]Running daily cleanup of old archived jobs...");
    try {
      const deletedCount = await cleanUpOldArchivedJobsService();
      if (deletedCount.count > 0) {
        // If any jobs were deleted, log the count
        console.log(
          `[CRON] Sucessfully deleted ${deletedCount.count} old archived jobs.`,
        );
      } else {
        console.log("[CRON] No old archived jobs to delete.");
      }
    } catch (error) {
      console.error("[CRON] Error during cleanup:", error);
    }
  });
};
