import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";

// 1. Den snälla IP-spärren (Stoppar bot-nätverk)
export const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 20, // Hela datorn/nätverket får skicka 20 ärenden totalt
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "Unsuccessful",
      message:
        "You have sent too many support tickets from this IP address. Please try again in 15 minutes.",
    });
  },
});

// 2. Den strikta E-post-spärren (Stoppar dig från att spamma)
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 3, // Varje specifik e-postadress får bara skicka 3 ärenden
  keyGenerator: (req: Request, res: Response) => {
    // LÖSNINGEN: Skicka in req.ip (en sträng) istället för hela req-objektet!
    return req.body.email || ipKeyGenerator(req.ip || "");
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "Unsuccessful",
      message:
        "You have sent too many support tickets from this email address. Please try again in 15 minutes.",
    });
  },
});
