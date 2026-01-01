import { VALIDATION_CONFIG } from "@/constant";
import { MESSAGES } from "@/constant/messages";
import { REGEX_PATTERN } from "@/constant/regex-pattern";
import { z } from "zod";

export const strongPassword = z
  .string()
  .trim()
  .min(
    VALIDATION_CONFIG.LENGTH_STRING,
    MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.SHORT,
  )
  .refine((val) => REGEX_PATTERN.alphaLowerCase.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_LOW_CASE,
  })
  .refine((val) => REGEX_PATTERN.alphaUpperCase.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_UP_CASE,
  })
  .refine((val) => REGEX_PATTERN.numbers.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_NUMBER,
  })
  .refine((val) => REGEX_PATTERN.symbols.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_SYMBOL,
  });
