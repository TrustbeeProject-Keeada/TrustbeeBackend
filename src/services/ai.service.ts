import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import {
  evaluateJobMatch,
  generateCv,
  generateCvStructured,
} from "../ai_implementation/ai_instance.js";
import { buildCvPdf } from "../utils/pdf.builder.js";

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

        // Debug: log the raw response structure
        console.log(
          `🔍 Job bank response keys:`,
          Object.keys(hit).slice(0, 20),
        );
        if (hit.description) {
          console.log(`📝 description type:`, typeof hit.description);
          if (typeof hit.description === "object") {
            console.log(
              `📝 description keys:`,
              Object.keys(hit.description).slice(0, 10),
            );
            console.log(
              `📝 description content:`,
              JSON.stringify(hit.description).substring(0, 200),
            );
          } else {
            console.log(
              `📝 description length:`,
              String(hit.description).length,
            );
          }
        }

        if (hit && hit.id) {
          // Build description from all available fields
          const descriptionParts: string[] = [];

          // Helper function to safely convert to string
          const toString = (
            value: any,
            maxLength: number = 500,
          ): string | null => {
            if (!value) return null;
            if (typeof value === "string") return value;
            if (typeof value === "object") {
              // Try common field names for text content
              if (value.text) return String(value.text).substring(0, maxLength);
              if (value.label) return String(value.label);
              if (value.name) return String(value.name);
              if (value.description)
                return String(value.description).substring(0, maxLength);
              if (value.value) return String(value.value);
              if (value.content)
                return String(value.content).substring(0, maxLength);
              // If it's an array of objects with text, join them
              if (Array.isArray(value)) {
                return value
                  .map((v) => toString(v, 100))
                  .filter((v) => v)
                  .join(" ");
              }
              // Last resort: return empty (don't use [object Object])
              return null;
            }
            return String(value);
          };

          const titleStr = toString(hit.headline);
          if (titleStr) descriptionParts.push(`Job Title: ${titleStr}`);

          if (hit.description)
            descriptionParts.push(toString(hit.description) || "");
          if (hit.job_description)
            descriptionParts.push(toString(hit.job_description) || "");
          if (hit.text) descriptionParts.push(toString(hit.text) || "");
          if (hit.occupation)
            descriptionParts.push(`Occupation: ${toString(hit.occupation)}`);

          if (hit.working_hours_type) {
            const wh = toString(hit.working_hours_type);
            if (wh && wh !== "[object Object]")
              descriptionParts.push(`Working hours: ${wh}`);
          }
          if (hit.employment_type) {
            const et = toString(hit.employment_type);
            if (et && et !== "[object Object]")
              descriptionParts.push(`Employment type: ${et}`);
          }
          if (hit.salary_type) {
            const st = toString(hit.salary_type);
            if (st && st !== "[object Object]")
              descriptionParts.push(`Salary type: ${st}`);
          }
          if (hit.application_details)
            descriptionParts.push(toString(hit.application_details) || "");
          if (hit.terms_of_employment) {
            const toe = toString(hit.terms_of_employment);
            if (toe && toe !== "[object Object]")
              descriptionParts.push(`Terms: ${toe}`);
          }
          if (hit.working_place)
            descriptionParts.push(`Location: ${toString(hit.working_place)}`);
          if (hit.workplace_address)
            descriptionParts.push(
              `Address: ${toString(hit.workplace_address)}`,
            );

          const fullDescription =
            descriptionParts
              .filter((p) => p && p.length > 0 && p !== "[object Object]")
              .join("\n\n") || "No description available";

          console.log(
            `📝 Job description built (length: ${fullDescription.length})`,
          );
          console.log(
            `📝 First 300 chars: ${fullDescription.substring(0, 300)}`,
          );

          return {
            id: hit.id,
            title: titleStr || "",
            description: fullDescription,
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

    // DEBUG: Log what's being sent to AI
    console.log("\n═══ MATCHMAKING DEBUG ═══");
    console.log(`📋 Job ID: ${jobAdd.id}`);
    console.log(`📋 Job Title: ${jobAdd.title}`);
    const descLength = jobAdd.description
      ? String(jobAdd.description).length
      : 0;
    const descPreview = jobAdd.description
      ? String(jobAdd.description).substring(0, 200)
      : "[NO DESCRIPTION]";
    console.log(`📋 Job Description (${descLength} chars): ${descPreview}...`);
    console.log(`👤 Job Seeker ID: ${jobseeker.id}`);
    const cvLength = cvText ? cvText.length : 0;
    const cvPreview = cvText ? cvText.substring(0, 200) : "[NO CV TEXT]";
    console.log(`📄 CV Text (${cvLength} chars): ${cvPreview}...`);
    console.log("═══════════════════════\n");

    // Ensure description is a string
    const jobDescription = String(jobAdd.description || "");
    if (!jobDescription || jobDescription.length === 0) {
      throw new AppError("Job description is empty or missing", 400);
    }

    // Evaluate the match
    const MatchData = await evaluateJobMatch(jobDescription, cvText);

    return MatchData;
  } catch (error) {
    console.error("Job matching error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Error occurred while matching jobs`, 500);
  }
};

export const GenerateCvService = async (jobSeekerId: number) => {
  try {
    // Fetch the job seeker from database
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { id: jobSeekerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        skills: true,
        languages: true,
        bio: true,
        portfolioLink: true,
        personalStatement: true,
      },
    });

    if (!jobSeeker) {
      throw new AppError("Job Seeker not found", 404);
    }

    // Validate required fields
    if (
      !jobSeeker.firstName ||
      !jobSeeker.lastName ||
      !jobSeeker.email ||
      !jobSeeker.phoneNumber
    ) {
      throw new AppError(
        "Job Seeker profile is incomplete. Name, email, and phone number are required.",
        400,
      );
    }

    if (!jobSeeker.skills || jobSeeker.skills.length === 0) {
      throw new AppError(
        "Job Seeker must have at least one skill to generate a CV",
        400,
      );
    }

    // Prepare CV generation input
    const cvInput = {
      name: `${jobSeeker.firstName} ${jobSeeker.lastName}`,
      email: jobSeeker.email,
      phoneNumber: jobSeeker.phoneNumber,
      skills: jobSeeker.skills || [],
      languages: jobSeeker.languages || [],
      bio: jobSeeker.bio || "Motivated professional seeking new opportunities",
      portfolioLink: jobSeeker.portfolioLink || undefined,
      personalStatement: jobSeeker.personalStatement || undefined,
    };

    // Generate CV using AI
    const generatedCvText = await generateCv(cvInput);

    if (!generatedCvText || generatedCvText.trim().length === 0) {
      throw new AppError("Failed to generate CV", 500);
    }

    // DEBUG: Log CV generation
    console.log("\n═══ CV GENERATION DEBUG ═══");
    console.log(`✅ Generated CV for Job Seeker ID: ${jobSeekerId}`);
    console.log(`📄 CV Length: ${generatedCvText.length} characters`);
    console.log(
      `📄 Preview (first 300 chars): ${generatedCvText.substring(0, 300)}...`,
    );
    console.log("═══════════════════════\n");

    return {
      success: true,
      jobSeekerId,
      cv: generatedCvText,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("CV generation error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Error occurred while generating CV`, 500);
  }
};
 
export const GenerateCvPdfService = async (
  jobSeekerId?: number,
  requestData?: any,
) => {
  try {
    // Helper: build a normalized cvInput from either DB record or incoming request data
    const buildCvInputFromRequest = (data: any) => {
      const snapshot = data.formSnapshot || data;
      const personal = snapshot.personal || data.personal || {};

      const firstName =
        personal.firstName || data.firstName || snapshot.firstName;
      const lastName = personal.lastName || data.lastName || snapshot.lastName;
      const email = personal.email || data.email || snapshot.email;
      const phoneNumber =
        personal.phone || personal.phoneNumber || data.phone || snapshot.phone;
      const skills = snapshot.skills || data.skills || [];
      const languages = snapshot.languages || data.languages || [];
      const bio =
        snapshot.summary ||
        snapshot.bio ||
        data.summary ||
        data.bio ||
        "Motivated professional seeking new opportunities";
      const portfolioLink = snapshot.portfolioLink || data.portfolioLink;
      const personalStatement =
        snapshot.personalStatement || data.personalStatement;

      const name = `${firstName || ""} ${lastName || ""}`.trim();

      return {
        name,
        email,
        phoneNumber,
        skills,
        languages,
        bio,
        portfolioLink,
        personalStatement,
      };
    };

    // If requestData is provided, use it to generate CV (optionally save if jobSeekerId also present)
    if (requestData) {
      const cvInput = buildCvInputFromRequest(requestData);

      // Validate required fields (same requirements as DB flow)
      if (!cvInput.name || !cvInput.email || !cvInput.phoneNumber) {
        throw new AppError(
          "Profile is incomplete. Name, email, and phone number are required.",
          400,
        );
      }

      if (!cvInput.skills || cvInput.skills.length === 0) {
        throw new AppError(
          "At least one skill is required to generate a CV",
          400,
        );
      }

      // Generate structured CV from AI
      const cvStructure = await generateCvStructured(cvInput);

      if (!cvStructure) {
        throw new AppError("Failed to generate CV structure", 500);
      }

      // Build PDF and get as Buffer
      const pdfBuffer = await buildCvPdf(cvStructure);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new AppError("Failed to generate PDF buffer", 500);
      }

      // If jobSeekerId is provided, save to DB; otherwise just return base64 buffer
      if (jobSeekerId) {
        const pdfBytes = new Uint8Array(pdfBuffer);

        const updatedJobSeeker = await prisma.jobSeeker.update({
          where: { id: jobSeekerId },
          data: { cv: pdfBytes },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cv: true,
            updatedAt: true,
          },
        });

        return {
          success: true,
          jobSeekerId,
          firstName: updatedJobSeeker.firstName,
          lastName: updatedJobSeeker.lastName,
          email: updatedJobSeeker.email,
          pdfSizeBytes: pdfBuffer.length,
          savedAt: updatedJobSeeker.updatedAt,
          message: "CV PDF generated and saved to database successfully",
        };
      }

      // Return base64 PDF for immediate download/use by frontend
      const base64 = Buffer.from(pdfBuffer).toString("base64");
      const dataUrl = `data:application/pdf;base64,${base64}`;

      return {
        success: true,
        pdfBase64: dataUrl,
        pdfSizeBytes: pdfBuffer.length,
        generatedAt: new Date(),
        message: "CV PDF generated successfully (not saved)",
      };
    }

    // --- Legacy / DB-backed flow: fetch the job seeker from database by id ---
    if (!jobSeekerId) {
      throw new AppError("Job Seeker ID is required", 400);
    }

    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: { id: jobSeekerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        skills: true,
        languages: true,
        bio: true,
        portfolioLink: true,
        personalStatement: true,
      },
    });

    if (!jobSeeker) {
      throw new AppError("Job Seeker not found", 404);
    }

    // Validate required fields
    if (
      !jobSeeker.firstName ||
      !jobSeeker.lastName ||
      !jobSeeker.email ||
      !jobSeeker.phoneNumber
    ) {
      throw new AppError(
        "Job Seeker profile is incomplete. Name, email, and phone number are required.",
        400,
      );
    }

    if (!jobSeeker.skills || jobSeeker.skills.length === 0) {
      throw new AppError(
        "Job Seeker must have at least one skill to generate a CV",
        400,
      );
    }

    // Prepare CV generation input
    const cvInput = {
      name: `${jobSeeker.firstName} ${jobSeeker.lastName}`,
      email: jobSeeker.email,
      phoneNumber: jobSeeker.phoneNumber,
      skills: jobSeeker.skills || [],
      languages: jobSeeker.languages || [],
      bio: jobSeeker.bio || "Motivated professional seeking new opportunities",
      portfolioLink: jobSeeker.portfolioLink || undefined,
      personalStatement: jobSeeker.personalStatement || undefined,
    };

    // Generate structured CV from AI
    const cvStructure = await generateCvStructured(cvInput);

    if (!cvStructure) {
      throw new AppError("Failed to generate CV structure", 500);
    }

    // Build PDF and get as Buffer
    const pdfBuffer = await buildCvPdf(cvStructure);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new AppError("Failed to generate PDF buffer", 500);
    }

    // Convert Buffer to Uint8Array for Prisma
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Save PDF to database
    const updatedJobSeeker = await prisma.jobSeeker.update({
      where: { id: jobSeekerId },
      data: {
        cv: pdfBytes,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cv: true,
        updatedAt: true,
      },
    });

    // DEBUG: Log CV PDF generation
    console.log("\n═══ CV PDF GENERATION DEBUG ═══");
    console.log(`✅ Generated CV PDF for Job Seeker ID: ${jobSeekerId}`);
    console.log(`📄 PDF Buffer Size: ${pdfBuffer.length} bytes`);
    console.log(
      `� Saved to database for user: ${jobSeeker.firstName} ${jobSeeker.lastName}`,
    );
    console.log(`⏰ Updated at: ${updatedJobSeeker.updatedAt}`);
    console.log("═════════════════════════════════\n");

    return {
      success: true,
      jobSeekerId,
      firstName: updatedJobSeeker.firstName,
      lastName: updatedJobSeeker.lastName,
      email: updatedJobSeeker.email,
      pdfSizeBytes: pdfBuffer.length,
      savedAt: updatedJobSeeker.updatedAt,
      message: "CV PDF generated and saved to database successfully",
    };
  } catch (error) {
    console.error("CV PDF generation error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      `Error occurred while generating CV PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500,
    );
  }
};
