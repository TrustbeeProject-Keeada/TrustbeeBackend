import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { prisma } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.gemini_api_key,
});

const systemInstruction = readFileSync(
  join(__dirname, "ai_matchmaking_instruction.txt"),
  "utf-8",
);

export async function evaluateJobMatch(
  jobDescription: string,
  candidateProfile: string,
) {
  const prompt = `${systemInstruction}

---EVALUATION REQUEST---

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${candidateProfile}

TASK: Evaluate the job-to-candidate match and respond ONLY with the JSON structure specified above.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  return response.text;
}

export async function getJobMatchingData(recipientId: number, jobAdId: number) {
  try {
    // Fetch the job seeker's CV and profile
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { id: recipientId },
    });

    if (!jobSeeker) {
      throw new Error(`Job Seeker with ID ${recipientId} not found`);
    }

    // Fetch the job ad's description
    const job = await prisma.job.findUnique({
      where: { id: jobAdId },
      include: {
        company: true,
      },
    });

    if (!job) {
      throw new Error(`Job with ID ${jobAdId} not found`);
    }

    return {
      jobSeeker: {
        id: recipientId,
        name: `${jobSeeker.firstName} ${jobSeeker.lastName}`,
        email: jobSeeker.email,
        cv: (jobSeeker as any).CV,
        skills: jobSeeker.skills,
        languages: jobSeeker.languages,
        bio: jobSeeker.bio,
        portfolioLink: jobSeeker.portfolioLink,
        personalStatement: (jobSeeker as any).PersonalStatement,
      },
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        companyName: job.company.companyName,
      },
    };
  } catch (error) {
    console.error("Error fetching job matching data:", error);
    throw error;
  }
}

export async function api_health() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },
    ],
  });
  console.log(response.text);
  return response.text;
}

export async function job_matching_evaluation(userId: number, jobAdId: number) {
  const data = await getJobMatchingData(userId, jobAdId);
  const user_cv = `cv: ${data.jobSeeker.cv}`;
  const job_description = `job description: ${data.job.description}`;
  const prompt = `${systemInstruction}

${user_cv}

${job_description}

Please evaluate how well this candidate matches this job.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction + "\n\n" + user_cv + "\n\n" + job_description,
          },
        ],
      },
    ],
  });
  console.log(response.text);
  return response.text;
}
