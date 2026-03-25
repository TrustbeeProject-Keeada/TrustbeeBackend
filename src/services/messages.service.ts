import { prisma } from "../config/db.js";
import { SendMessageTypeZ } from "../models/message.model.js";

export const sendMessageService = async (
  senderId: number,
  senderRole: string,
  data: SendMessageTypeZ,
) => {
  // 1. Bygg objektet dynamiskt
  const messageData: {
    content: string;
    senderJobSeekerId?: number;
    senderRecruiterId?: number;
    receiverJobSeekerId?: number;
    receiverRecruiterId?: number;
  } = { content: data.content };

  // 2. Vem skickar?
  if (senderRole === "JOB_SEEKER") {
    messageData.senderJobSeekerId = senderId;
  } else if (senderRole === "COMPANY_RECRUITER") {
    messageData.senderRecruiterId = senderId;
  }

  // 3. Vem tar emot?
  if (data.receiverRole === "JOB_SEEKER") {
    messageData.receiverJobSeekerId = data.receiverId;
  } else if (data.receiverRole === "COMPANY_RECRUITER") {
    messageData.receiverRecruiterId = data.receiverId;
  }

  // 4. Spara i databasen
  const newMessage = await prisma.messages.create({
    data: messageData,
  });

  return newMessage;
};

export const getConversationService = async (
  userId: number,
  userRole: string,
  otherId: number,
  otherRole: string,
) => {
  const userIsJobSeeker = userRole === "JOB_SEEKER";
  const otherIsJobSeeker = otherRole === "JOB_SEEKER";

  const userSenderField = userIsJobSeeker
    ? "senderJobSeekerId"
    : "senderRecruiterId";
  const userReceiverField = userIsJobSeeker
    ? "receiverJobSeekerId"
    : "receiverRecruiterId";

  const otherSenderField = otherIsJobSeeker
    ? "senderJobSeekerId"
    : "senderRecruiterId";
  const otherReceiverField = otherIsJobSeeker
    ? "receiverJobSeekerId"
    : "receiverRecruiterId";

  // Hämta hela konversationen (både skickat och mottaget mellan dessa två)
  const messages = await prisma.messages.findMany({
    where: {
      OR: [
        { [userSenderField]: userId, [otherReceiverField]: otherId }, // Jag skickade till dem
        { [otherSenderField]: otherId, [userReceiverField]: userId }, // De skickade till mig
      ],
    },
    orderBy: { createdAt: "asc" }, // Sortera från äldst till nyast
  });

  return messages;
};
