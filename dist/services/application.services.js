import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
// Arbetssökande: Ansök till ett jobb
export const applyForJobService = async (jobSeekerId, jobId) => {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job)
        throw new AppError("Job not found", 404);
    // Kolla om användaren redan ansökt
    const existingApplication = await prisma.application.findUnique({
        where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
    });
    if (existingApplication)
        throw new AppError("You have already applied for this job", 400);
    return await prisma.application.create({
        data: { jobSeekerId, jobId, status: "PENDING" },
    });
};
// Företag: Hämta alla ansökningar för ett specifikt jobb
export const getJobApplicationsService = async (jobId, recruiterId) => {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job)
        throw new AppError("Job not found", 404);
    // Säkerhetsspärr: Bara jobbet ägare får se ansökningarna
    if (job.companyId !== recruiterId) {
        throw new AppError("Forbidden: You can only view applications for your own jobs", 403);
    }
    return await prisma.application.findMany({
        where: { jobId },
        include: {
            jobSeeker: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                }, // Döljer lösenordet
            },
        },
    });
};
// Företag: Ändra status på en ansökan (t.ex. till ACCEPTED)
export const updateApplicationStatusService = async (applicationId, recruiterId, data) => {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true },
    });
    if (!application)
        throw new AppError("Application not found", 404);
    if (application.job.companyId !== recruiterId) {
        throw new AppError("Forbidden", 403);
    }
    return await prisma.application.update({
        where: { id: applicationId },
        data: { status: data.status },
    });
};
