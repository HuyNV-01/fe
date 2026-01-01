import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";

export const getListUserApi = async (payload: {
  params: IPaginationOptions;
}) => {
  const { params } = payload;
  const result = await apiClient.get("/users", {
    params,
  });

  return result;
};

export const getUserProfileApi = async (payload: { userId: string }) => {
  const { userId } = payload;
  const result = apiClient.get(`/users/profile/${userId}`);
  return result;
};

export const getMyProfileApi = async () => {
  const result = apiClient.get(`/users/me`);
  return result;
};
