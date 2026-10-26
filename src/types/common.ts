import type {
  ContactStatusEnum,
  KeyContactsEnum,
  StatusEnum,
  ValidRolesEnum,
} from "@/common/enum";
import type { IPaginationOptions } from ".";

//#region interface
export interface IRegister {
  email: string;
  password: string;
  name: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IResendActivation {
  email: string;
}

export interface IVerifyOtp {
  email?: string;
  otp: string;
}

export interface IResetPassword {
  email?: string;
  newPassword: string;
  resetToken?: string;
}

export interface ICallbackLogin {
  accessToken: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateDirectChatPayload {
  receiverId: string;
}

export interface IRequestContactPayload {
  targetUserId: string;
}

export interface IAcceptFriendPayload {
  senderId: string;
}

export interface IRemoveContactPayload {
  targetId: string;
}

export interface IUpdateContactAliasPayload {
  targetId: string;
  alias: string;
}

export interface IPaginationContacts extends IPaginationOptions {
  type?: KeyContactsEnum | ContactStatusEnum;
}
//#endregion interface

//#region Res
export interface IBaseResponse<T = any> {
  status: number;
  code: number;
  message: string;
  data?: T;
}

export interface IUserRes {
  email?: string;
  name?: string;
  role?: ValidRolesEnum;
  status?: StatusEnum;
  currentSignInAt?: Date | string;
  lastSignInAt?: Date | string;
  provider?: string;
  uid?: string;
  id?: string;
  createdAt?: Date | string;
  createdBy?: string | null;
  updatedAt?: Date | string;
  updatedBy?: string | null;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
  avatar?: string | null;
  resetToken?: string;
}

export interface IContactsDataRes {
  id: string;
  userId: string;
  contactId: string;
  status: ContactStatusEnum;
  contactUser: IUserRes;
  alias?: string | null;
}

export interface IBaseGetListRes {
  data: any;
  meta: IPaginationMeta;
}

export interface IGetListUsers extends IBaseGetListRes {
  data: IUserRes[];
}

export interface IGetListUsersResponse extends IBaseResponse {
  data: IGetListUsers;
}

export interface IContactRes extends IUserRes {
  contactStatus: ContactStatusEnum | null;
}

export interface IGetListContacts extends IBaseGetListRes {
  data: IContactRes[];
}

export interface IGetListContactsResponse extends IBaseResponse {
  data: IGetListContacts;
}

export interface IGetContacts extends IBaseGetListRes {
  data: IContactsDataRes[];
}

export interface IGetContactsResponse extends IBaseResponse {
  data: IGetContacts;
}

export interface IRegisterResponse extends IBaseResponse {}

export interface ILoginRes {
  user: IUserRes;
  accessToken: string;
  refreshToken?: string;
}

export interface ILoginResponse extends IBaseResponse {
  data: ILoginRes;
}

export interface ILoginThirdResponse extends IBaseResponse {
  data: IUserRes;
}

export interface IVerifyOtpDataRes {
  resetToken: string;
  expiresInSeconds: number;
}

export interface IVerifyOtpResponse extends IBaseResponse<IVerifyOtpDataRes> {}

export interface IVerifyEmailRes {
  email: string;
  resetToken?: string;
}

//#endregion Res

//#region types

export type TSidebarViewMode = "CHAT" | "CONTACTS";

//#endregion type
