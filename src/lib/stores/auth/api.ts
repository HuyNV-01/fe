import config from "@/config";
import apiClient from "@/lib/http/axios-client";
import type {
  IForgotPassword,
  ILogin,
  IRegister,
  IResetPassword,
  IVerifyOtp,
} from "@/types/common";

export const registerApi = async (payload: { data: IRegister }) => {
  const { data } = payload;
  const result = await apiClient.post("/auth/register", data);
  return result;
};

export const loginApi = async (payload: { data: ILogin }) => {
  const { data } = payload;
  const result = await apiClient.post("/auth/login", data);
  return result;
};

export const logoutApi = async () => {
  const result = await apiClient.post("/auth/logout");
  return result;
};

export const forgotPasswordApi = async (payload: { data: IForgotPassword }) => {
  const { data } = payload;
  const result = await apiClient.post(`/auth/forgot-password`, data);
  return result;
};

export const verifyOtpApi = async (payload: { data: IVerifyOtp }) => {
  const { data } = payload;
  const result = await apiClient.post(`/auth/verify-otp`, data);
  return result;
};

export const resetPasswordApi = async (payload: { data: IResetPassword }) => {
  const { data } = payload;
  const result = await apiClient.post(`/auth/reset-password`, data);
  return result;
};

export const loginWithGoogleApi = async () => {
  const rootUrl = process.env.NEXT_PUBLIC_API_URL;
  window.location.href = `${rootUrl}${config.routes.protected.google}`;
};

export const callbackLoginApi = async () => {
  const result = await apiClient.get("/auth/callback");
  return result;
};
