import { prisma } from "../config/db.js";
import { SendMessageTypeZ } from "../models/message.model.js";

export const sendMessageService = async (
  senderId: number,
  senderRole: string,
  data: SendMessageTypeZ,
) => {
  // 1. Bygg objektet dynamiskt
  const messageData: any = { content: data.content };

  // 2. Vem skickar?
  if (senderRole === "jobseeker") {
    messageData.senderJobSeekerId = senderId;
  } else if (senderRole === "companyrecruiter") {
    messageData.senderRecruiterId = senderId;
  }

  // 3. Vem tar emot?
  if (data.receiverRole === "jobseeker") {
    messageData.receiverJobSeekerId = data.receiverId;
  } else if (data.receiverRole === "companyrecruiter") {
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
  const userIsJobSeeker = userRole === "jobseeker";
  const otherIsJobSeeker = otherRole === "jobseeker";

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
