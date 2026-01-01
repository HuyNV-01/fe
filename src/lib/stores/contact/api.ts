import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";
import type {
  IAcceptFriendPayload,
  IPaginationContacts,
  IRemoveContactPayload,
  IRequestContactPayload,
} from "@/types/common";

export const findContactUsersApi = async (payload: {
  params: IPaginationOptions;
}) => {
  const { params } = payload;
  const result = await apiClient.get("/contacts/find-contact-users", {
    params,
  });

  return result;
};

export const requestContactApi = async (payload: {
  data: IRequestContactPayload;
}) => {
  const { data } = payload;
  const result = await apiClient.post("/contacts/request", data);

  return result;
};

export const acceptFriendApi = async (payload: {
  data: IAcceptFriendPayload;
}) => {
  const { data } = payload;
  const result = await apiClient.post(`/contacts/accept/${data.senderId}`);

  return result;
};

export const removeContactApi = async (payload: {
  data: IRemoveContactPayload;
}) => {
  const { data } = payload;
  const result = await apiClient.delete(`/contacts/${data.targetId}`);

  return result;
};

export const getContactsApi = async (payload: {
  params: IPaginationContacts;
}) => {
  const { params } = payload;
  const result = await apiClient.get("/contacts", {
    params,
  });

  return result;
};
