import { NextFunction, Request, Response } from "express";
import {
  sendMessageService,
  getConversationService,
} from "../services/messages.service.js";
import { AppError } from "../utils/app.error.js";

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.user?.id;
    const senderRole = req.user?.role;

    if (!senderId || !senderRole) {
      return next(new AppError("Unauthorized", 401));
    }

    if (
      senderId === req.body.receiverId &&
      senderRole === req.body.receiverRole
    ) {
      return res.status(400).json({
        message: "You cannot send a message to yourself",
      });
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
    const myId = req.user?.id;
    const myRole = req.user?.role;

    if (!myId || !myRole) {
      return next(new AppError("Unauthorized", 401));
    }

    const otherId = Number(req.params.otherId);
    const otherRole = req.query.role as string;

    if (!otherId || !otherRole) {
      return res.status(400).json({
        message:
          "Please provide the other user's ID in the URL and their role in the query string",
      });
    }

    const messages = await getConversationService(
      myId,
      myRole,
      otherId,
      otherRole,
    );

    res.status(200).json({
      status: "success",
      results: messages.length,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
};
