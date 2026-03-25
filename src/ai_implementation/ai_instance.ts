import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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
  const prompt = `
Job Description:
${jobDescription}

Candidate Profile:
${candidateProfile}

Please evaluate how well this candidate matches this job.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction + "\n\n" + prompt,
          },
        ],
      },
    ],
  });

  return response.text;
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
