import type { ContactStatusEnum } from "@/common/enum";
import type { IUserRes } from "./common";

export interface IUserProfile extends IUserRes {
  isMe?: boolean;
  relationship?: ContactStatusEnum | null;
  isBlocked?: boolean;
  avatar?: string;
}
