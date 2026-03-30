// import cron from "node-cron";
// import { cleanUpOldArchivedJobsService } from "../services/job.service.js";

// export const startCronJobs = () => {
//   cron.schedule("0 0 * * *", async () => {
//     console.log("[CRON]Running daily cleanup of old archived jobs...");
//     try {
//       const deletedCount = await cleanUpOldArchivedJobsService();
//       if (deletedCount > 0) {
//         console.log(
//           `[CRON] Sucessfully deleted ${deletedCount} old archived jobs.`,
//         );
//       } else {
//         console.log("[CRON] No old archived jobs to delete.");
//       }
//     } catch (error) {
//       console.error("[CRON] Error during cleanup:", error);
//     }
//   });
// };
