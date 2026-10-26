import config from "@/config";
import apiClient from "@/lib/http/axios-client";
import type {
  IForgotPassword,
  ILogin,
  IRegister,
  IResendActivation,
  IResetPassword,
  IVerifyOtp,
} from "@/types/common";

export const registerApi = async (payload: { data: IRegister }) => {
  const { data } = payload;
  return apiClient.post("/auth/register", data);
};

export const resendActivationApi = async (payload: {
  data: IResendActivation;
}) => {
  const { data } = payload;
  return apiClient.post("/auth/resend-activation", data);
};

export const loginApi = async (payload: { data: ILogin }) => {
  const { data } = payload;
  return apiClient.post("/auth/login", data);
};

export const logoutApi = async () => {
  return apiClient.post("/auth/logout");
};

export const forgotPasswordApi = async (payload: { data: IForgotPassword }) => {
  const { data } = payload;
  return apiClient.post("/auth/forgot-password", data);
};

export const verifyOtpApi = async (payload: { data: IVerifyOtp }) => {
  const { data } = payload;
  return apiClient.post("/auth/verify-otp", data);
};

export const resetPasswordApi = async (payload: { data: IResetPassword }) => {
  const { data } = payload;
  return apiClient.post("/auth/reset-password", data);
};

export const loginWithGoogleApi = async () => {
  const rootUrl = process.env.NEXT_PUBLIC_API_URL;
  window.location.href = `${rootUrl}${config.routes.protected.google}`;
};

export const callbackLoginApi = async () => {
  return apiClient.get("/auth/callback");
};
