import { NextFunction, Request, Response } from "express";
import {
  sendMessageService,
  getConversationService,
} from "../services/messages.service.js";
import { AppError } from "../utils/app.error.js";

declare global {
  namespace Express {
    interface Request {
      jobseeker?: {
        id: number;
        role: string;
      };
    }
  }
}

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.jobseeker?.id;
    const senderRole = req.jobseeker?.role;

    if (!senderId || !senderRole) {
      return next(new AppError("Unauthorized", 401));
    }

    const message = await sendMessageService(senderId, senderRole, req.body);

    res.status(201).json({ status: "success", data: message });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.jobseeker?.id;
    const userRole = req.jobseeker?.role;

    if (!userId || !userRole) {
      return next(new AppError("Unauthorized", 401));
    }

    // --- VATTENTÄT FIX 1: Hantera otherId ---
    const rawId = req.params.otherId;
    const safeIdString = Array.isArray(rawId) ? rawId[0] : String(rawId);
    // Vi lägger till ', 10' för att garantera att det tolkas som ett vanligt decimaltal (best practice)
    const otherId = parseInt(safeIdString, 10);

    // --- VATTENTÄT FIX 2: Hantera otherRole ---
    const rawRole = req.params.otherRole;
    const otherRole: string = Array.isArray(rawRole)
      ? rawRole[0]
      : String(rawRole);

    if (isNaN(otherId) || !otherRole) {
      return next(new AppError("Invalid parameters provided", 400));
    }

    // Nu vet TypeScript till 100% att datatyperna är korrekta
    const messages = await getConversationService(
      userId,
      userRole,
      otherId,
      otherRole,
    );

    res.status(200).json({
      status: "success",
      results: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
