import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { prisma } from "../config/db.js";
import type { CvStructure } from "../utils/pdf.builder.js";

let aiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is required to use the Gemini API. Please set it in your .env file.",
    );
  }

  if (!aiClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
};

// Allow overriding model via env. Fallback to a broadly used model expected to be
// available on many GenAI accounts. If your account uses a different model,
// set GENAI_MODEL in env (e.g. "gemini-2.5-flash-lite").
const DEFAULT_GENAI_MODEL = process.env.GENAI_MODEL || "gemini-2.5-flash-lite";
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

  const response = await getGeminiClient().models.generateContent({
    model: DEFAULT_GENAI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: { responseMimeType: "application/json" },
  });

  const responseText = response.text || "";

  try {
    return JSON.parse(responseText.trim());
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
  const response = await getGeminiClient().models.generateContent({
    model: DEFAULT_GENAI_MODEL,
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

  const response = await getGeminiClient().models.generateContent({
    model: DEFAULT_GENAI_MODEL,
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
  email: string;
  phoneNumber: string;
  location?: string;
  skills: string[];
  languages: string[];
  bio: string;
  portfolioLink?: string;
  personalStatement?: string;
  workExperience?: unknown;
  education?: unknown;
  certifications?: unknown;
  projects?: unknown;
  awards?: unknown;
  volunteering?: unknown;
  interests?: unknown;
}

export async function generateCv(input: CvGenerationInput): Promise<string> {
  const cvGenerationInstructions = readFileSync(
    join(__dirname, "cv_generator.txt"),
    "utf-8",
  );

  const userProfile = `
Email: ${input.email}
Phone: ${input.phoneNumber}
Location: ${input.location || ""}
Bio: ${input.bio}
Skills: ${input.skills.join(", ")}
Languages: ${input.languages.join(", ")}
${input.portfolioLink ? `Portfolio: ${input.portfolioLink}` : ""}
${input.personalStatement ? `Personal Statement: ${input.personalStatement}` : ""}
${input.workExperience ? `Work Experience: ${JSON.stringify(input.workExperience)}` : ""}
${input.education ? `Education: ${JSON.stringify(input.education)}` : ""}
${input.certifications ? `Certifications: ${JSON.stringify(input.certifications)}` : ""}
${input.projects ? `Projects: ${JSON.stringify(input.projects)}` : ""}
${input.awards ? `Awards: ${JSON.stringify(input.awards)}` : ""}
${input.volunteering ? `Volunteering: ${JSON.stringify(input.volunteering)}` : ""}
${input.interests ? `Interests: ${JSON.stringify(input.interests)}` : ""}
  `.trim();

  const prompt = `${cvGenerationInstructions}

---USER PROFILE---
${userProfile}

TASK: Generate a professional CV for this user based on their information above. Output ONLY the CV in a clean, professional format.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: DEFAULT_GENAI_MODEL,
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
Email: ${input.email}
Phone: ${input.phoneNumber}
Location: ${input.location || ""}
Bio: ${input.bio}
Skills: ${input.skills.join(", ")}
Languages: ${input.languages.join(", ")}
${input.portfolioLink ? `Portfolio: ${input.portfolioLink}` : ""}
${input.personalStatement ? `Personal Statement: ${input.personalStatement}` : ""}
${input.workExperience ? `Work Experience: ${JSON.stringify(input.workExperience)}` : ""}
${input.education ? `Education: ${JSON.stringify(input.education)}` : ""}
${input.certifications ? `Certifications: ${JSON.stringify(input.certifications)}` : ""}
${input.projects ? `Projects: ${JSON.stringify(input.projects)}` : ""}
${input.awards ? `Awards: ${JSON.stringify(input.awards)}` : ""}
${input.volunteering ? `Volunteering: ${JSON.stringify(input.volunteering)}` : ""}
${input.interests ? `Interests: ${JSON.stringify(input.interests)}` : ""}
  `.trim();

  const prompt = `${cvGenerationInstructions}

---USER PROFILE---
${userProfile}

---JSON SCHEMA REQUIREMENT---
Return ONLY valid JSON matching this schema exactly. No markdown, no explanation.

RULES (read first):
- Do NOT include any name in the output (no full name, no initials, no placeholders)
- Use the email and phone EXACTLY as provided — do not reformat or correct them
- Never invent dates, employers, projects, achievements, metrics, certifications, or responsibilities the user did not provide
- You may rephrase and regroup content for clarity, and infer immediately-implied domain labels (e.g. SQL → Databases). Nothing beyond that.
- Every bullet must start with a past-tense action verb. Never start with "Responsible for", "Helped with", or "Worked on"
- If input is sparse, write fewer bullets rather than padding with generic ones

SCHEMA:
{
  "preferredFont": "Calibri" | "Georgia" | null,
  "headline": string | null,
  "contactInfo": {
    "email": string,
    "phone": string,
    "location": string | null
  },
  "professionalSummary": string | null,
  "sections": [
    {
      "heading": string,
      "paragraphs": [string] | null,
      "bullets": [string] | null
    }
  ],
  "footer": string | null
}

PARAGRAPH FORMAT for WORK EXPERIENCE and EDUCATION entries:
Each entry is ONE string in the paragraphs array, using this exact layout:
  "Job Title\nCompany Name, Location\n- Bullet 1\n- Bullet 2 | Date Range"

Rules for this format:
- First line = title/degree (rendered large, accent color)
- Second line = organization name and location (rendered as subtitle)
- Bullet lines starting with "- " follow immediately after
- The text after " | " is the date range, right-aligned — put ONLY the date there, nothing else
- Do NOT use the section-level "bullets" array for WORK EXPERIENCE or EDUCATION entries

SECTION-LEVEL bullets (not paragraphs) are for: SKILLS, LANGUAGES, CERTIFICATIONS, and similar flat lists.

INSTRUCTIONS:
1. Parse all information from the user profile above
2. Create a professional CV structure matching the schema
3. Include sections as applicable: SKILLS, LANGUAGES, WORK EXPERIENCE, EDUCATION, PROJECTS, CERTIFICATIONS
4. Only set "headline" if the user's role is unambiguous from their experience; otherwise null
5. Only set "preferredFont" to Calibri or Georgia if it fits; otherwise null

TASK: Generate a structured CV JSON for this user.
  `;

  const response = await getGeminiClient().models.generateContent({
    model: DEFAULT_GENAI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: { responseMimeType: "application/json" },
  });

  const jsonText = (response.text || "").trim();

  if (!jsonText) {
    throw new Error("Failed to generate CV structure from AI response");
  }

  try {
    const cvStructure = JSON.parse(jsonText) as CvStructure;

    cvStructure.contactInfo = {
      email: input.email,
      phone: input.phoneNumber,
      location: input.location || null,
    };
    if (cvStructure.fullName) {
      cvStructure.fullName = undefined;
    }

    // Validate structure
    if (
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
