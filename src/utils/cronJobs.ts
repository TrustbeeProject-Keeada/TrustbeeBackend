import cron from "node-cron";
import {
  cleanUpOldArchivedJobsService,
  archiveExpiredJobsService,
} from "../services/job.service.js";

export const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    // This means the job will run every day at midnight (00:00)
    console.log("[Cron] Running daily cleanup of old archived jobs...");
    try {
      const deletedCount = await cleanUpOldArchivedJobsService();
      if (deletedCount.count > 0) {
        // If any jobs were deleted, log the count
        console.log(
          `[Cron] Sucessfully deleted ${deletedCount.count} old archived jobs.`,
        );
      } else {
        console.log("[Cron] No old archived jobs to delete.");
      }
    } catch (error) {
      console.error("[Cron] Error during cleanup:", error);
    }
  });

  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Checking for expired jobs to archive...");
    try {
      const archivedCount = await archiveExpiredJobsService();
      if (archivedCount.count > 0) {
        console.log(`[Cron] Archived ${archivedCount.count} expired jobs.`);
      } else {
        console.log("[Cron] No expired jobs to archive.");
      }
    } catch (error) {
      console.error("[Cron] Error during archiving expired jobs:", error);
    }
  });
};
