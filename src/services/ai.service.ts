import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { evaluateJobMatch } from "../ai_implementation/ai_instance.js";

// Lazily import pdf-parse at runtime and accept either Buffer or Uint8Array
const extractCvText = async (buffer: Buffer | Uint8Array): Promise<string> => {
  const buf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer as Uint8Array);

  // Import PDFParse class
  try {
    const { PDFParse } = (await import("pdf-parse")) as any;
    const pdfParser = new PDFParse({ data: buf });
    const textResult = await pdfParser.getText();
    return textResult.text as string;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw error;
  }
};

// Fetch job from either database or job bank
const fetchJobById = async (jobId: number, source?: "database" | "jobbank") => {
  // If source is specified, try that source first
  if (source === "database" || !source) {
    try {
      const databaseJob = await prisma.job.findUnique({
        select: {
          id: true,
          title: true,
          description: true,
        },
        where: { id: jobId },
      });

      if (databaseJob) {
        console.log(`✅ Found job ${jobId} in database`);
        return {
          ...databaseJob,
          source: "database" as const,
        };
      }
    } catch (error) {
      console.error("Error fetching from database:", error);
    }
  }

  // If not found in database or source is "jobbank", try job bank API
  if (source === "jobbank" || !source) {
    try {
      console.log(`🔍 Searching for job ${jobId} in job bank API...`);
      const url = `https://jobsearch.api.jobtechdev.se/ad/${jobId}`;
      const response = await fetch(url);

      console.log(`📡 Job bank API response status: ${response.status}`);

      if (response.ok) {
        const hit = await response.json();
        console.log(`✅ Found job ${jobId} in job bank`);

        if (hit && hit.id) {
          return {
            id: hit.id,
            title: hit.headline,
            description: hit.description || "",
            source: "jobbank" as const,
          };
        }
      } else {
        console.log(
          `❌ Job bank returned status ${response.status}: ${response.statusText}`,
        );
        const errorText = await response.text();
        console.log(`Job bank response: ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Error fetching from job bank:", error);
    }
  }

  console.log(`⚠️ Job ${jobId} not found in either database or job bank`);
  return null;
};

export const MatchMakingService = async (
  jobAddId: number,
  jobseekerId: number,
) => {
  try {
    // Fetch the job from either database or job bank
    const jobAdd = await fetchJobById(jobAddId);

    const jobseeker = await prisma.jobSeeker.findUnique({
      select: {
        id: true,
        cv: true,
      },
      where: { id: jobseekerId },
    });

    if (!jobAdd || !jobseeker) {
      throw new AppError("Job or Job Seeker not found", 404);
    }

    if (!jobseeker.cv) {
      throw new AppError("Job Seeker CV not found", 404);
    }

    // Extract text from CV (PDF in bytes)
    const cvText = await extractCvText(jobseeker.cv as any);

    if (!cvText || cvText.trim().length === 0) {
      throw new AppError("Failed to extract text from CV", 400);
    }

    // Evaluate the match
    const MatchData = await evaluateJobMatch(jobAdd.description, cvText);

    return MatchData;
  } catch (error) {
    console.error("Job matching error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Error occurred while matching jobs`,
      500,
    );
  }
};
