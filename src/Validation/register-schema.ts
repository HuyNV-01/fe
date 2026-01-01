import { VALIDATION_CONFIG } from "@/constant";
import { z } from "zod";
import { strongPassword } from "./base-schema";
import { MESSAGES } from "@/constant/messages";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        VALIDATION_CONFIG.MIN_LENGTH_STRING,
        MESSAGES.ZOD.AUTH.REGISTER.NAME.SHORT,
      ),

    email: z.string().trim().email(MESSAGES.ZOD.AUTH.REGISTER.EMAIL.INVALID),

    password: strongPassword,

    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: MESSAGES.ZOD.AUTH.REGISTER.CONFIRM_PASSWORD.INVALID,
    path: ["confirmPassword"],
  });
