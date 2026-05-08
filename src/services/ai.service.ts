import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import {
  evaluateJobMatch,
  generateCv,
  generateCvStructured,
} from "../ai_implementation/ai_instance.js";
import { buildCvPdf } from "../utils/pdf.builder.js";

const extractCvText = async (buffer: Buffer | Uint8Array): Promise<string> => {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as Uint8Array);
  try {
    const { PDFParse } = (await import("pdf-parse")) as any;
    const pdfParser = new PDFParse({ data: buf });
    const textResult = await pdfParser.getText();
    return textResult.text as string;
  } catch (error) {
    throw error;
  }
};

const fetchJobById = async (jobId: number) => {
  const databaseJob = await prisma.job.findUnique({
    select: { id: true, title: true, description: true },
    where: { id: jobId },
  });
  if (databaseJob) return { ...databaseJob, source: "database" as const };

  try {
    const url = `https://jobsearch.api.jobtechdev.se/ad/${jobId}`;
    const response = await fetch(url);
    if (response.ok) {
      const hit = await response.json();
      if (hit?.id) {
        const description =
          typeof hit.description === "object"
            ? hit.description?.text || hit.description?.text_formatted || ""
            : String(hit.description || "");
        return {
          id: hit.id,
          title: hit.headline || "",
          description,
          source: "jobbank" as const,
        };
      }
    }
  } catch {
    // job bank unavailable — return null
  }

  return null;
};

// ── Strip first/last name from any string to keep the CV anonymous ──────────
const removeNameFromText = (value: string, names: string[]) => {
  if (!value || !names.length) return value;
  let output = value;
  for (const name of names) {
    if (!name) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output
      .replace(new RegExp(`\\b${escaped}\\b`, "gi"), "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return output;
};

const sanitizeCvStructure = (structure: any, names: string[]) => {
  if (!structure || !names.length) return structure;
  if (structure.professionalSummary)
    structure.professionalSummary = removeNameFromText(structure.professionalSummary, names);
  if (Array.isArray(structure.sections)) {
    structure.sections = structure.sections.map((section: any) => ({
      ...section,
      heading:      removeNameFromText(section.heading   || "", names),
      paragraphs:   section.paragraphs?.map((p: string) => removeNameFromText(p, names)),
      bullets:      section.bullets?.map((b: string) => removeNameFromText(b, names)),
      dividerLines: section.dividerLines?.map((d: string) => removeNameFromText(d, names)),
    }));
  }
  if (structure.footer) structure.footer = removeNameFromText(structure.footer, names);
  return structure;
};

const mergeArray = (primary?: any[], fallback?: any[]) =>
  Array.from(new Set([...(primary || []), ...(fallback || [])].filter(Boolean)));

// ────────────────────────────────────────────────────────────────────────────
export const MatchMakingService = async (jobAddId: number, jobseekerId: number) => {
  const jobAdd = await fetchJobById(jobAddId);
  const jobseeker = await prisma.jobSeeker.findUnique({
    select: { id: true, cv: true },
    where: { id: jobseekerId },
  });

  if (!jobAdd || !jobseeker) throw new AppError("Job or Job Seeker not found", 404);
  if (!jobseeker.cv)         throw new AppError("Job Seeker CV not found", 404);

  const cvText = await extractCvText(jobseeker.cv as any);
  if (!cvText?.trim()) throw new AppError("Failed to extract text from CV", 400);

  const jobDescription = String(jobAdd.description || "");
  if (!jobDescription) throw new AppError("Job description is empty or missing", 400);

  return evaluateJobMatch(jobDescription, cvText);
};

// ────────────────────────────────────────────────────────────────────────────
export const GenerateCvService = async (jobSeekerId: number) => {
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: jobSeekerId },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      phoneNumber: true, city: true, country: true, skills: true,
      languages: true, bio: true, portfolioLink: true, personalStatement: true,
    },
  });

  if (!jobSeeker) throw new AppError("Job Seeker not found", 404);

  if (!jobSeeker.firstName || !jobSeeker.lastName || !jobSeeker.email || !jobSeeker.phoneNumber)
    throw new AppError("Job Seeker profile is incomplete. Name, email, and phone number are required.", 400);

  if (!jobSeeker.skills?.length)
    throw new AppError("Job Seeker must have at least one skill to generate a CV", 400);

  const cvInput = {
    email:             jobSeeker.email,
    phoneNumber:       jobSeeker.phoneNumber,
    location:          [jobSeeker.city, jobSeeker.country].filter(Boolean).join(", "),
    skills:            jobSeeker.skills,
    languages:         jobSeeker.languages || [],
    bio:               jobSeeker.bio || "Motivated professional seeking new opportunities",
    portfolioLink:     jobSeeker.portfolioLink || undefined,
    personalStatement: jobSeeker.personalStatement || undefined,
  };

  let generatedCvText = await generateCv(cvInput);

  const nameParts = [jobSeeker.firstName, jobSeeker.lastName]
    .filter(Boolean)
    .flatMap((name) => String(name).split(/\s+/));
  generatedCvText = removeNameFromText(generatedCvText, nameParts);

  if (!generatedCvText?.trim()) throw new AppError("Failed to generate CV", 500);

  return { success: true, jobSeekerId, cv: generatedCvText, generatedAt: new Date() };
};

// ────────────────────────────────────────────────────────────────────────────
export const GenerateCvPdfService = async (
  jobSeekerId?: number,
  requestData?: any,
) => {
  // ── Build a normalized input object from any incoming shape ──────────────
  const buildCvInputFromRequest = (data: any) => {
    const snapshot  = data.formSnapshot || data;
    const personal  = snapshot.personal || data.personal || {};

    const firstName  = personal.firstName  || data.firstName  || snapshot.firstName;
    const lastName   = personal.lastName   || data.lastName   || snapshot.lastName;
    const email      = personal.email      || data.email      || snapshot.email;
    const phoneNumber =
      personal.phone || personal.phoneNumber || data.phone || snapshot.phone;
    const city =
      personal.city    || data.city    || snapshot.city    || data.location?.city;
    const country =
      personal.country || data.country || snapshot.country || data.location?.country;
    const location =
      personal.location || data.location || snapshot.location ||
      [city, country].filter(Boolean).join(", ");

    const skills    = snapshot.skills    || data.skills    || [];
    const languages = snapshot.languages || data.languages || [];
    const bio =
      snapshot.summary || snapshot.bio || data.summary || data.bio ||
      "Motivated professional seeking new opportunities";
    const portfolioLink = snapshot.portfolioLink || data.portfolioLink;
    const personalStatement = snapshot.personalStatement || data.personalStatement;
    const workExperience =
      snapshot.workExperience || snapshot.experience ||
      data.workExperience || data.experience || data.employmentHistory;
    const education =
      snapshot.education || data.education || data.educationalBackground;
    const certifications = snapshot.certifications || data.certifications;
    const projects       = snapshot.projects       || data.projects;
    const awards         = snapshot.awards         || data.awards;
    const volunteering   = snapshot.volunteering   || data.volunteering;
    const interests      = snapshot.interests      || data.interests;

    return {
      firstName, lastName, email, phoneNumber, location,
      skills, languages, bio, portfolioLink, personalStatement,
      workExperience, education, certifications, projects, awards, volunteering, interests,
    };
  };

  // ── Helper: generate PDF buffer from AI and return base64 data URL ───────
  const generatePdfBase64 = async (cvInput: ReturnType<typeof buildCvInputFromRequest>, nameParts: string[]) => {
    const aiInput = {
      email:             cvInput.email,
      phoneNumber:       cvInput.phoneNumber,
      location:          cvInput.location,
      skills:            cvInput.skills,
      languages:         cvInput.languages,
      bio:               cvInput.bio,
      portfolioLink:     cvInput.portfolioLink,
      personalStatement: cvInput.personalStatement,
      workExperience:    cvInput.workExperience,
      education:         cvInput.education,
      certifications:    cvInput.certifications,
      projects:          cvInput.projects,
      awards:            cvInput.awards,
      volunteering:      cvInput.volunteering,
      interests:         cvInput.interests,
    };

    let cvStructure = await generateCvStructured(aiInput);
    cvStructure = sanitizeCvStructure(cvStructure, nameParts);
    if (cvStructure) cvStructure.fullName = undefined;
    if (!cvStructure) throw new AppError("Failed to generate CV structure", 500);

    const pdfBuffer = await buildCvPdf(cvStructure);
    if (!pdfBuffer?.length) throw new AppError("Failed to generate PDF buffer", 500);

    const base64  = Buffer.from(pdfBuffer).toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;
    return { pdfBuffer, dataUrl, cvStructure };
  };

  // ── Path 1: requestData provided ─────────────────────────────────────────
  if (requestData) {
    let cvInput = buildCvInputFromRequest(requestData);

    // Merge with DB profile if the user is logged in
    if (jobSeekerId) {
      const dbProfile = await prisma.jobSeeker.findUnique({
        where: { id: jobSeekerId },
        select: {
          firstName: true, lastName: true, email: true, phoneNumber: true,
          city: true, country: true, skills: true, languages: true,
          bio: true, portfolioLink: true, personalStatement: true,
        },
      });

      if (dbProfile) {
        const dbLocation = [dbProfile.city, dbProfile.country].filter(Boolean).join(", ");
        cvInput = {
          ...cvInput,
          firstName:  cvInput.firstName  || dbProfile.firstName,
          lastName:   cvInput.lastName   || dbProfile.lastName,
          email:      cvInput.email      || dbProfile.email,
          phoneNumber:cvInput.phoneNumber|| dbProfile.phoneNumber,
          location:   cvInput.location   || dbLocation,
          skills:     mergeArray(cvInput.skills, dbProfile.skills),
          languages:  mergeArray(cvInput.languages, dbProfile.languages),
          bio:        cvInput.bio        || dbProfile.bio,
          portfolioLink:     cvInput.portfolioLink     || dbProfile.portfolioLink,
          personalStatement: cvInput.personalStatement || dbProfile.personalStatement,
        };
      }
    }

    const fullName = `${cvInput.firstName || ""} ${cvInput.lastName || ""}`.trim();
    if (!fullName || !cvInput.email || !cvInput.phoneNumber)
      throw new AppError("Profile is incomplete. Name, email, and phone number are required.", 400);
    if (!cvInput.skills?.length)
      throw new AppError("At least one skill is required to generate a CV", 400);

    const nameParts = [cvInput.firstName, cvInput.lastName]
      .filter(Boolean)
      .flatMap((n) => String(n).split(/\s+/));

    const { pdfBuffer, dataUrl } = await generatePdfBase64(cvInput, nameParts);

    // Save to DB if the user is logged in, then always return base64 for download
    if (jobSeekerId) {
      await prisma.jobSeeker.update({
        where: { id: jobSeekerId },
        data: { cv: new Uint8Array(pdfBuffer) },
      });
    }

    return {
      success: true,
      pdfBase64:    dataUrl,
      pdfSizeBytes: pdfBuffer.length,
      generatedAt:  new Date(),
      message: jobSeekerId
        ? "CV PDF generated, saved, and ready for download"
        : "CV PDF generated and ready for download",
    };
  }

  // ── Path 2: DB-only (legacy) — no request body, fetch entirely from DB ───
  if (!jobSeekerId) throw new AppError("Job Seeker ID is required", 400);

  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: jobSeekerId },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      phoneNumber: true, city: true, country: true, skills: true,
      languages: true, bio: true, portfolioLink: true, personalStatement: true,
    },
  });

  if (!jobSeeker) throw new AppError("Job Seeker not found", 404);

  if (!jobSeeker.firstName || !jobSeeker.lastName || !jobSeeker.email || !jobSeeker.phoneNumber)
    throw new AppError("Job Seeker profile is incomplete. Name, email, and phone number are required.", 400);

  if (!jobSeeker.skills?.length)
    throw new AppError("Job Seeker must have at least one skill to generate a CV", 400);

  const cvInput = {
    firstName:  jobSeeker.firstName,
    lastName:   jobSeeker.lastName,
    email:      jobSeeker.email,
    phoneNumber:jobSeeker.phoneNumber,
    location:   [jobSeeker.city, jobSeeker.country].filter(Boolean).join(", "),
    skills:     jobSeeker.skills,
    languages:  jobSeeker.languages || [],
    bio:        jobSeeker.bio || "Motivated professional seeking new opportunities",
    portfolioLink:     jobSeeker.portfolioLink || undefined,
    personalStatement: jobSeeker.personalStatement || undefined,
  };

  const nameParts = [jobSeeker.firstName, jobSeeker.lastName]
    .filter(Boolean)
    .flatMap((n) => String(n).split(/\s+/));

  const { pdfBuffer, dataUrl } = await generatePdfBase64(cvInput, nameParts);

  await prisma.jobSeeker.update({
    where: { id: jobSeekerId },
    data: { cv: new Uint8Array(pdfBuffer) },
  });

  return {
    success: true,
    pdfBase64:    dataUrl,
    pdfSizeBytes: pdfBuffer.length,
    generatedAt:  new Date(),
    message: "CV PDF generated, saved, and ready for download",
  };
};
