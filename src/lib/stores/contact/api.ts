import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";
import type {
  IAcceptFriendPayload,
  IPaginationContacts,
  IRemoveContactPayload,
  IRequestContactPayload,
  IUpdateContactAliasPayload,
} from "@/types/common";

export const findContactUsersApi = async (payload: {
  params: IPaginationOptions;
}) => {
  const { params } = payload;
  return apiClient.get("/contacts/find-contact-users", {
    params,
  });
};

export const requestContactApi = async (payload: {
  data: IRequestContactPayload;
}) => {
  const { data } = payload;
  return apiClient.post("/contacts/request", data);
};

export const acceptFriendApi = async (payload: {
  data: IAcceptFriendPayload;
}) => {
  const { data } = payload;
  return apiClient.post(`/contacts/accept/${data.senderId}`);
};

export const removeContactApi = async (payload: {
  data: IRemoveContactPayload;
}) => {
  const { data } = payload;
  return apiClient.delete(`/contacts/${data.targetId}`);
};

export const updateContactAliasApi = async (payload: {
  data: IUpdateContactAliasPayload;
}) => {
  const { data } = payload;
  return apiClient.put(`/contacts/alias/${data.targetId}`, {
    alias: data.alias,
  });
};

export const getContactsApi = async (payload: {
  params: IPaginationContacts;
}) => {
  const { params } = payload;
  return apiClient.get("/contacts", {
    params,
  });
};

export const blockUserApi = async (targetId: string) => {
  return apiClient.post(`/contacts/block/${targetId}`);
};

export const unblockUserApi = async (targetId: string) => {
  return apiClient.delete(`/contacts/block/${targetId}`);
};
