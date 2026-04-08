import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { evaluateJobMatch } from "../ai_implementation/ai_instance.js";

// Lazily import pdf-parse at runtime and accept either Buffer or Uint8Array
const extractCvText = async (buffer: Buffer | Uint8Array): Promise<string> => {
  const buf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer as Uint8Array);
  // dynamic import to avoid typing/cjs interop issues with pdf-parse's published types
  const pdfModule = (await import("pdf-parse")) as any;
  const pdfFn = pdfModule.default ?? pdfModule;
  const data = await pdfFn(buf);
  return data.text as string;
};

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

    const cvText = await extractCvText(jobseeker.cv as any);

    if (!cvText || cvText.trim().length === 0) {
      throw new AppError("Failed to extract text from CV", 400);
    }

    const MatchData = await evaluateJobMatch(jobAdd.description, cvText);

    return MatchData;
  } catch (error) {
    console.error("Job matching error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Error occurred while matching jobs: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
    );
  }
};
