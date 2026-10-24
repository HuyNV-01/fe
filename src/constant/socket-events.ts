export const SOCKET_EVENTS = {
  CHAT: {
    // --- Room & Basic ---
    JOIN_ROOM: "join_room",
    LEAVE_ROOM: "leave_room",

    // --- Messaging ---
    SEND_MESSAGE: "send_message",
    NEW_MESSAGE: "new_message",

    // --- Advanced Status ---
    MARK_READ: "mark_read",
    MESSAGE_READ: "message_read",

    MESSAGE_RECEIVED: "message_received",
    MESSAGE_STATUS_UPDATE: "message_status_update",
    MESSAGE_STATUS_UPDATE_BATCH: "message_status_update_batch",
    ACK_PENDING_MESSAGES: "ack_pending_messages",

    // --- Typing & User ---
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
