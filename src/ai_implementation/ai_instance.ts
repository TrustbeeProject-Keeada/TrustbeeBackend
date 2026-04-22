import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../config/db.js";
import type { CvStructure } from "../utils/pdf.builder.js";

const ai = new GoogleGenAI({
  apiKey: process.env.gemini_api_key,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const systemInstruction = readFileSync(
  join(__dirname, "ai_matchmaking_instruction.txt"),
  "utf-8",
);

export async function evaluateJobMatch(
  jobDescription: string,
  candidateProfileText: string,
) {
  // candidateProfileText is expected to be extracted plain text from the CV
  const prompt = `${systemInstruction}

---EVALUATION REQUEST---

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${candidateProfileText}

TASK: Evaluate the job-to-candidate match and respond ONLY with the JSON structure specified above.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-lite",
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

  // Extract JSON from the response, handling markdown code blocks
  const responseText = response.text || "";
  const jsonMatch =
    responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
    responseText.match(/```\n?([\s\S]*?)\n?```/);

  const jsonString = jsonMatch?.[1] || responseText;

  try {
    // Parse and return as an object to ensure it's valid JSON
    return JSON.parse(jsonString.trim());
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", error);
    console.error("Raw response:", responseText);
    throw new Error("AI response was not valid JSON");
  }
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
            text:
              systemInstruction + "\n\n" + user_cv + "\n\n" + job_description,
          },
        ],
      },
    ],
  });
  console.log(response.text);
  return response.text;
}

interface CvGenerationInput {
  name: string;
  email: string;
  phoneNumber: string;
  skills: string[];
  languages: string[];
  bio: string;
  portfolioLink?: string;
  personalStatement?: string;
}

export async function generateCv(input: CvGenerationInput): Promise<string> {
  const cvGenerationInstructions = readFileSync(
    join(__dirname, "cv_generator.txt"),
    "utf-8",
  );

  const userProfile = `
Name: ${input.name}
Email: ${input.email}
Phone: ${input.phoneNumber}
Bio: ${input.bio}
Skills: ${input.skills.join(", ")}
Languages: ${input.languages.join(", ")}
${input.portfolioLink ? `Portfolio: ${input.portfolioLink}` : ""}
${input.personalStatement ? `Personal Statement: ${input.personalStatement}` : ""}
  `.trim();

  const prompt = `${cvGenerationInstructions}

---USER PROFILE---
${userProfile}

TASK: Generate a professional CV for this user based on their information above. Output ONLY the CV in a clean, professional format.
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

  const generatedCv = response.text || "";

  if (!generatedCv || generatedCv.trim().length === 0) {
    throw new Error("Failed to generate CV from AI response");
  }

  return generatedCv;
}

export async function generateCvStructured(
  input: CvGenerationInput,
): Promise<CvStructure> {
  const cvGenerationInstructions = readFileSync(
    join(__dirname, "cv_generator.txt"),
    "utf-8",
  );

  const userProfile = `
Name: ${input.name}
Email: ${input.email}
Phone: ${input.phoneNumber}
Bio: ${input.bio}
Skills: ${input.skills.join(", ")}
Languages: ${input.languages.join(", ")}
${input.portfolioLink ? `Portfolio: ${input.portfolioLink}` : ""}
${input.personalStatement ? `Personal Statement: ${input.personalStatement}` : ""}
  `.trim();

  const prompt = `${cvGenerationInstructions}

---USER PROFILE---
${userProfile}

---JSON SCHEMA REQUIREMENT---
You MUST return ONLY valid JSON (no markdown, no explanation) with this exact schema:
{
  "fullName": "string (full name)",
  "contactInfo": {
    "email": "string",
    "phone": "string",
    "location": "string or null"
  },
  "professionalSummary": "string (2-4 sentences, optional or null)",
  "sections": [
    {
      "heading": "string (e.g., SKILLS, WORK EXPERIENCE, EDUCATION)",
      "paragraphs": ["string"] or null,
      "bullets": ["string"] or null
    }
  ],
  "footer": "string or null"
}

INSTRUCTIONS:
1. Parse all information from the user profile above
2. Create a professional CV structure that matches the schema exactly
3. Include sections like: SKILLS, LANGUAGES, PROFESSIONAL SUMMARY (if applicable)
4. Format work experience and education as bullet points if available
5. Return ONLY the JSON object, nothing else
6. Do NOT include markdown formatting or explanations
7. Ensure all strings are properly escaped

TASK: Generate a structured CV JSON for this user.
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

  let jsonText = response.text || "";

  // Clean up response - remove markdown fences if present
  jsonText = jsonText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  if (!jsonText) {
    throw new Error("Failed to generate CV structure from AI response");
  }

  try {
    const cvStructure = JSON.parse(jsonText) as CvStructure;

    // Validate structure
    if (
      !cvStructure.fullName ||
      !cvStructure.contactInfo ||
      !cvStructure.contactInfo.email ||
      !cvStructure.contactInfo.phone
    ) {
      throw new Error("Invalid CV structure: missing required fields");
    }

    return cvStructure;
  } catch (error) {
    console.error("Failed to parse CV structure JSON:", jsonText);
    throw new Error(
      `Failed to parse CV structure: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
