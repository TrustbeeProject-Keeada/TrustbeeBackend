import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import jwt from "jsonwebtoken";
export const registerJobSeekerService = async (data) => {
    const existingJobSeeker = await prisma.jobSeeker.findUnique({
        where: { email: data.email },
    });
    if (existingJobSeeker) {
        throw new AppError("Job seeker with that email already exists", 409);
    }
    // encrypt the password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return prisma.jobSeeker.create({
        data: {
            firstName: data.firstname,
            lastName: data.lastname,
            email: data.email,
            password: hashedPassword,
        },
    });
};
export const logInJobSeekerService = async (data) => {
    // compare the passed in email with the one in the database
    const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { email: data.email },
    });
    if (!jobSeeker) {
        throw new AppError("Invalid email or password", 401);
    }
    // compare the passed in password with the one in the database
    const isPasswordValid = await bcrypt.compare(data.password, jobSeeker.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }
    // add jwt token generation here
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new AppError("JWT_SECRET not set", 500);
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN ??
        "1d");
    const token = jwt.sign({
        id: jobSeeker.id,
        email: jobSeeker.email,
        role: jobSeeker.role,
    }, jwtSecret, {
        expiresIn,
    });
    return { ...jobSeeker, token };
};
export const registerCompanyRecruiterService = async (data) => {
    const existingCompanyRecruiter = await prisma.companyRecruiter.findUnique({
        where: { email: data.email },
    });
    if (existingCompanyRecruiter) {
        throw new AppError("Company recruiter with that email already exists", 409);
    }
    // encrypt the password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return prisma.companyRecruiter.create({
        data: {
            email: data.email,
            companyName: data.companyname,
            password: hashedPassword,
            organizationNumber: data.organizationnumber,
            phoneNumber: data.phonenumber,
        },
    });
};
export const logInCompanyRecruiterService = async (data) => {
    // compare the passed in email with the one in the database
    const companyRecruiter = await prisma.companyRecruiter.findUnique({
        where: { email: data.email },
    });
    if (!companyRecruiter) {
        throw new AppError("Invalid email or password", 401);
    }
    // compare the passed in password with the one in the database
    const isPasswordValid = await bcrypt.compare(data.password, companyRecruiter.password);
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }
    // add jwt token generation here
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new AppError("JWT_SECRET not set", 500);
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN ??
        "1d");
    const token = jwt.sign({
        id: companyRecruiter.id,
        email: companyRecruiter.email,
        role: companyRecruiter.role,
    }, jwtSecret, {
        expiresIn,
    });
    return { ...companyRecruiter, token };
};
