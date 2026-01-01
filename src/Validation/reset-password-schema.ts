import { z } from "zod";
import { strongPassword } from "./base-schema";
import { MESSAGES } from "@/constant/messages";

export const resetPasswordSchema = z
  .object({
    password: strongPassword,

    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: MESSAGES.ZOD.AUTH.REGISTER.CONFIRM_PASSWORD.INVALID,
    path: ["confirmPassword"],
  });
