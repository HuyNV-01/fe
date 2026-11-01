import type { ContactStatusEnum } from "@/common/enum";
import type { ISharedMediaItem } from "./chat";
import type { IUserRes } from "./common";

export type ProfileAccessLevel = "SELF" | "FRIEND" | "STRANGER";

export interface IUserPrivacySettings {
  showEmail?: boolean;
  showPhone?: boolean;
  showAlias?: boolean;
  showOnlineStatus?: boolean;
  showSharedMedia?: boolean;
}

export interface IUpdateProfilePayload {
  name?: string;
  bio?: string | null;
  phone?: string | null;
  privacySettings?: IUserPrivacySettings;
}

export interface IUserProfile extends IUserRes {
  isMe?: boolean;
  relationship?: ContactStatusEnum | null;
  accessLevel?: ProfileAccessLevel;
  isBlocked?: boolean;
  blockedByMe?: boolean;
  blockedByTarget?: boolean;
  isContentUnavailable?: boolean;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  phone?: string | null;
  alias?: string | null;
  isOnline?: boolean;
  friendCount?: number;
  privacySettings?: IUserPrivacySettings;
  sharedMedia?: ISharedMediaItem[];
  sharedFiles?: ISharedMediaItem[];
}
