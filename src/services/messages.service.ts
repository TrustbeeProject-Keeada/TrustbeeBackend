import { prisma } from "../config/db.js";
import { Prisma } from "../generated/prisma/index.js";
import { SendMessageTypeZ } from "../models/message.model.js";
import { AppError } from "../utils/app.error.js";

export const sendMessageService = async (
  senderId: number,
  senderRole: string,
  data: SendMessageTypeZ,
) => {
  const messageData: Prisma.MessagesUncheckedCreateInput = {
    content: data.content,
  };

  if (senderRole === "JOB_SEEKER") {
    messageData.senderJobSeekerId = senderId;
  } else if (senderRole === "COMPANY_RECRUITER") {
    messageData.senderRecruiterId = senderId;
  } else {
    throw new AppError("Invalid sender role", 400);
  }

  if (data.receiverRole === "JOB_SEEKER") {
    messageData.receiverJobSeekerId = data.receiverId;
  } else if (data.receiverRole === "COMPANY_RECRUITER") {
    messageData.receiverRecruiterId = data.receiverId;
  } else {
    throw new AppError("Invalid receiver role", 400);
  }

  const newMessage = await prisma.messages.create({
    data: messageData,
  });

  return newMessage;
};

export const getConversationService = async (
  myId: number,
  myRole: string,
  otherId: number,
  otherRole: string,
) => {
  const mySenderColumn =
    myRole === "JOB_SEEKER" ? "senderJobSeekerId" : "senderRecruiterId";
  const myReceiverColumn =
    myRole === "JOB_SEEKER" ? "receiverJobSeekerId" : "receiverRecruiterId";

  const otherSenderColumn =
    otherRole === "JOB_SEEKER" ? "senderJobSeekerId" : "senderRecruiterId";
  const otherReceiverColumn =
    otherRole === "JOB_SEEKER" ? "receiverJobSeekerId" : "receiverRecruiterId";

  const messages = await prisma.messages.findMany({
    where: {
      OR: [
        {
          [mySenderColumn]: myId,
          [otherReceiverColumn]: otherId,
        },
        {
          [otherSenderColumn]: otherId,
          [myReceiverColumn]: myId,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return messages;
};

export const getAllReceivedMessagesService = async (
  myId: number,
  myRole: string,
) => {
  const receiverColumn =
    myRole === "JOB_SEEKER" ? "receiverJobSeekerId" : "receiverRecruiterId";

  const messages = await prisma.messages.findMany({
    where: {
      [receiverColumn]: myId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      senderRecruiter: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
        },
      },
      senderJobSeeker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
    },
  });

  return messages;
};
