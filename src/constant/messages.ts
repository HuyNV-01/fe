import { objectToString } from "@/utils";
import { VALIDATION_CONFIG } from ".";
import { useTranslations } from "next-intl";

export const MESSAGES = {
  ZOD: {
    AUTH: {
      REGISTER: {
        ID: { INVALID: "auth.register.id.invalid" },
        NAME: { SHORT: "auth.register.name.short" },
        EMAIL: { INVALID: "auth.register.email.invalid" },
        PASSWORD: {
          SHORT: objectToString({
            key: "auth.register.password.short",
            values: { length: VALIDATION_CONFIG.LENGTH_STRING },
          }),
          MIN_LENGTH_LOW_CASE: objectToString({
            key: "auth.register.password.minLengthLowCase",
            values: { minLengthLowCase: VALIDATION_CONFIG.MIN_LENGTH_LOW_CASE },
          }),
          MIN_LENGTH_UP_CASE: objectToString({
            key: "auth.register.password.minLengthUpCase",
            values: { minLengthUpCase: VALIDATION_CONFIG.MIN_LENGTH_UP_CASE },
          }),
          MIN_LENGTH_NUMBER: objectToString({
            key: "auth.register.password.minLengthNumber",
            values: { minLengthNumber: VALIDATION_CONFIG.MIN_LENGTH_NUMBER },
          }),
          MIN_SYMBOL: objectToString({
            key: "auth.register.password.minSymbol",
            values: { minSymbol: VALIDATION_CONFIG.MIN_SYMBOL },
          }),
        },
        CONFIRM_PASSWORD: { INVALID: "auth.register.confirmPassword.invalid" },
      },
      LOGIN: {
        EMAIL: {
          REQUIRED: "auth.login.email.required",
          INVALID: "auth.login.email.invalid",
        },
        PASSWORD: {
          REQUIRED: "auth.login.password.required",
        },
      },
    },
    BANNER: {
      CREATE: {
        URL: { REQUIRED: "banner.create.url.required" },
        DESCRIPTIONS: { REQUIRED: "banner.create.descriptions.required" },
        START_DATE: { REQUIRED: "banner.create.startDate.required" },
        END_DATE: { REQUIRED: "banner.create.endDate.required" },
        NUMBER_ORDER: { REQUIRED: "banner.create.numberOrder.required" },
      },
    },
    PRODUCT: {
      CREATE: {
        NAME: { REQUIRED: "product.create.name.required" },
        CODE: { REQUIRED: "product.create.code.required" },
        PRICE: { REQUIRED: "product.create.price.required" },
        QUANTITY: { REQUIRED: "product.create.quantity.required" },
        QUANTITY_ALERT: { REQUIRED: "product.create.quantityAlert.required" },
        ORDER_UNIT: { REQUIRED: "product.create.orderUnit.required" },
        MULTIPLICATION_RATE: {
          REQUIRED: "product.create.multiplicationRate.required",
        },
      },
    },
    CATEGORY: {
      CREATE: {
        NAME: { REQUIRED: "category.create.name.required" },
      },
    },
    SIZE_TYPE: {
      CREATE: {
        NAME: { REQUIRED: "sizeType.create.name.required" },
        SIZE_CODE: { REQUIRED: "sizeType.create.sizeCode.required" },
        SIZE_TYPE: { REQUIRED: "sizeType.create.sizeType.required" },
      },
    },
  },
};

export const DEFAULT_EMPTY_MESSAGE = ({ key }: { key: "information" }) => {
  const t = useTranslations("Messages.empty");

  switch (key) {
    case "information":
      return t("information");
  }
};
