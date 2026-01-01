export const SOCKET_EVENTS = {
  CHAT: {
    JOIN_ROOM: "join_room",
    LEAVE_ROOM: "leave_room",
    SEND_MESSAGE: "send_message",
    NEW_MESSAGE: "new_message",
    TYPING: "user_typing",
    TYPING_EMIT: "typing",
    USER_STATUS: "user_status",
  },
  NOTIFICATION: {
    NEW: "new_notification",
    READ_ALL: "read_all_notifications",
  },
  SYSTEM: {
    EXCEPTION: "exception",
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    CONNECT_ERROR: "connect_error",
  },
  CONTACT: {
    REQUEST_RECEIVED: "contact.request_received",
    REQUEST_ACCEPTED: "contact.request_accepted",
    FRIEND_REMOVED: "contact.friend_removed",
  },
} as const;
