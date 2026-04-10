import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// 1. Den snälla IP-spärren (Stoppar bot-nätverk)
export const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 20, // Hela datorn/nätverket får skicka 20 ärenden totalt
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "fail",
      message:
        "Misstänkt aktivitet från detta nätverk. Försök igen om 15 minuter.",
    });
  },
});

// 2. Den strikta E-post-spärren (Stoppar dig från att spamma)
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 3, // Varje specifik e-postadress får bara skicka 3 ärenden
  keyGenerator: (req: Request) => {
    // Sortera på e-post (om det finns), annars fallback på IP
    return req.body.email || req.ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "fail",
      message:
        "Du har skickat för många ärenden från denna e-postadress. Försök igen om 15 minuter.",
    });
  },
});
