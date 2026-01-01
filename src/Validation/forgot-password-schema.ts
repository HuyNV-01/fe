import { z } from "zod";
import { MESSAGES } from "@/constant/messages";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, MESSAGES.ZOD.AUTH.LOGIN.EMAIL.REQUIRED)
    .email(MESSAGES.ZOD.AUTH.LOGIN.EMAIL.INVALID),
});
