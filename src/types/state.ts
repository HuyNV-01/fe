//#region interfaces

import type { TStatusSlice } from ".";
import type {
  IContactsDataRes,
  IGetContacts,
  IGetListContacts,
  IGetListUsers,
  ILoginRes,
  IUserRes,
} from "./common";
import type { IUserProfile } from "./profile";

export interface IAuthState {
  currentAccount: ILoginRes | undefined;
  value: IUserRes | undefined;
  status: TStatusSlice;
  authenticated?: boolean;
}

export interface IUserState {
  profile: IUserProfile | null;
  users: IGetListUsers;
  status: TStatusSlice;
  isProfileBlocked?: boolean;
  profileBlockedByMe?: boolean;
  profileError?: string | null;
}

export interface IContactState {
  contacts: IGetListContacts;
  listContacts: IGetContacts;
  blockedUsers: IContactsDataRes[];
  isLoadingBlocked?: boolean;
  status: TStatusSlice;
  isRequest: boolean;
}

