import { DEFAULT_LENGTH_OTP } from "@/constant";
import { z } from "zod";

export const verifyOtpSchema = z.object({
  otp: z.string().trim().min(DEFAULT_LENGTH_OTP),
});
