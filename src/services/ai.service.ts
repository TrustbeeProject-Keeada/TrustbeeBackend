import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { evaluateJobMatch } from "../ai_implementation/ai_instance.js";
export const MatchMakingService = async (
  jobseekerId: number,
  jobAddId: number,
) => {
  try {
    const jobAdd = await prisma.job.findUnique({
      select: {
        id: true,
        title: true,
        description: true,
      },
      where: { id: jobAddId },
    });
    const jobseeker = await prisma.jobSeeker.findUnique({
      select: {
        id: true,
        cv: true,
      },
      where: { id: jobseekerId },
    });

    if (!jobAdd || !jobseeker) {
      throw new AppError("Job Add or Job Seeker not found", 404);
    }

    if (!jobseeker.cv) {
      throw new AppError("Job Seeker CV not found", 404);
    }

    const MatchData = await evaluateJobMatch(jobAdd.description, jobseeker.cv);
    return MatchData;
  } catch (error) {
    console.error("Job matching error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Error occurred while matching jobs: ${error instanceof Error ? error.message : String(error)}`,
      500,
    );
  }
};
