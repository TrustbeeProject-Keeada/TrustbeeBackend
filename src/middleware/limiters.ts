import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

const json429 = (message: string) => (_req: Request, res: Response) => {
  res.status(429).json({ message });
};

/**
 * Global fallback — applied to the entire API.
 * Generous ceiling that only stops extreme abuse or runaway scripts.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429("Too many requests. Please slow down."),
});

/**
 * Login — strict, per IP.
 * 10 attempts per 15 min is plenty for a real user; locks out brute-force bots.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Too many login attempts from this IP. Please try again in 15 minutes.",
  ),
});

/**
 * Registration — prevents mass bot account creation.
 * 5 new accounts per hour per IP is more than enough for legitimate use.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Too many accounts created from this IP. Please try again in an hour.",
  ),
});

/**
 * AI endpoints (matchmake, CV generation).
 * Each call hits Google Gemini and costs real money — keep this tight.
 * 20 per hour per IP; a normal user won't come close.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "AI request limit reached. Please wait before making more AI requests.",
  ),
});

/**
 * Forgot-password — very tight to prevent email flooding / account enumeration timing.
 * 5 requests per hour per IP is generous for any real user.
 */
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "Too many password reset requests. Please try again in an hour.",
  ),
});

/**
 * Job applications — prevents spam applying.
 * 30 applications per hour is already very high for a real job seeker.
 */
export const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429(
    "You have submitted too many applications. Please wait before applying again.",
  ),
});
