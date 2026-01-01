//#region interfaces

import type { TStatusSlice } from ".";
import type {
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
}

export interface IContactState {
  contacts: IGetListContacts;
  listContacts: IGetContacts;
  status: TStatusSlice;
  isRequest: boolean;
}
