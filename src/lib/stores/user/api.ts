import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";

export const getListUserApi = async (payload: {
  params: IPaginationOptions;
}) => {
  const { params } = payload;
  return apiClient.get("/users", {
    params,
  });
};

export const getUserProfileApi = async (payload: { userId: string }) => {
  const { userId } = payload;
  return apiClient.get(`/users/profile/${userId}`);
};

export const getMyProfileApi = async () => {
  return apiClient.get("/users/me");
};

export const updateAvatarApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.put("/users/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteAvatarApi = async () => {
  return apiClient.delete("/users/avatar");
};
