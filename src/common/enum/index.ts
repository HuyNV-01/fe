export enum StatusEnum {
  NOT_ACTIVE = 0,
  ACTIVE = 1,
}

export enum ValidRolesEnum {
  USER = "USER",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

export enum MessageTypeEnum {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  CALL = "CALL",
  SYSTEM = "SYSTEM",
}

export enum CallTypeEnum {
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export enum CallStatusEnum {
  RINGING = "RINGING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
  REJECTED = "REJECTED",
  BUSY = "BUSY",
  CANCELLED = "CANCELLED",
}

export enum ConversationTypeEnum {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum GroupRoleEnum {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum SocketNamespaceEnum {
  BASE = "",
  CHAT = "/chat",
}

export enum ContactStatusEnum {
  PENDING_SENT = "PENDING_SENT",
  PENDING_RECEIVED = "PENDING_RECEIVED",
  FRIEND = "FRIEND",
  BLOCKED = "BLOCKED",
  NONE = "NONE",
}

export enum KeyContactsEnum {
  FRIENDS = "FRIEND",
  GROUPS = "GROUPS",
  PENDING_RECEIVED = "PENDING_RECEIVED",
  GROUPS_RECEIVED = "GROUPS_RECEIVED",
  PENDING_SENT = "PENDING_SENT",
}

export enum SortTypeEnum {
  ASC = "ASC",
  DESC = "DESC",
}
