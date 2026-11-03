const E2EE_STORAGE_KEY = "chat_e2ee_device_keypair_v1";

export interface StoredKeyPairInfo {
  keyId: string;
  publicKeyB64: string;
  privateKeyJwk: JsonWebKey;
  algorithm: "ECDH-P256";
}

export function sanitizeMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  return "";
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function downloadMediaFile(
  rawUrl: string,
  fileName = `download-${Date.now()}`,
): Promise<boolean> {
  const safeUrl = sanitizeMediaUrl(rawUrl);
  if (!safeUrl) return false;

  try {
    const response = await fetch(safeUrl, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    return true;
  } catch {
    const anchor = document.createElement("a");
    anchor.href = safeUrl;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  }
}

export async function getOrCreateDeviceE2EEKey(): Promise<StoredKeyPairInfo | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return null;
  }

  try {
    const cached = localStorage.getItem(E2EE_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached) as StoredKeyPairInfo;
    }

    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"],
    );

    const spkiBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey,
    );
    const privateKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );

    const publicKeyB64 = btoa(
      String.fromCharCode(...new Uint8Array(spkiBuffer)),
    );
    const keyId = `e2ee-${Date.now().toString(36)}`;

    const info: StoredKeyPairInfo = {
      keyId,
      publicKeyB64,
      privateKeyJwk,
      algorithm: "ECDH-P256",
    };

    localStorage.setItem(E2EE_STORAGE_KEY, JSON.stringify(info));
    return info;
  } catch (err) {
    console.warn("WebCrypto E2EE key generation skipped:", err);
    return null;
  }
}

import type { AttachmentE2EEMeta, AttachmentE2EEWrappedKey } from "@/types/chat";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Dẫn xuất khóa AES-GCM 256-bit chung giữa khóa riêng ECDH của thiết bị hiện tại
 * và khóa công khai SPKI Base64 của đối phương.
 */
async function deriveSharedWrappingKey(
  myPrivateKeyJwk: JsonWebKey,
  peerPublicKeyB64: string,
): Promise<CryptoKey> {
  const myPrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    myPrivateKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"],
  );

  const peerPublicKey = await window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(peerPublicKeyB64),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Mã hóa tệp đính kèm bằng Envelope Encryption (AES-256-GCM + ECDH-P256 Key Wrapping).
 * Trả về File đã mã hóa để upload lên S3 và metadata `e2ee` chứa khóa đã bọc cho từng thành viên.
 */
export async function encryptFileForConversationE2EE(params: {
  file: File;
  senderUserId: string;
  recipientPublicKeys: Record<string, { publicKey: string; keyId: string }>;
}): Promise<{ encryptedFile: File; e2eeMeta: AttachmentE2EEMeta } | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;

  const myKeyInfo = await getOrCreateDeviceE2EEKey();
  if (!myKeyInfo) return null;

  // 1. Sinh khóa đối xứng dùng 1 lần (CEK) cho tệp này
  const rawFileKey = window.crypto.getRandomValues(new Uint8Array(32));
  const fileIv = window.crypto.getRandomValues(new Uint8Array(12));

  const fileCryptoKey = await window.crypto.subtle.importKey(
    "raw",
    rawFileKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const plainBuffer = await params.file.arrayBuffer();
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: fileIv },
    fileCryptoKey,
    plainBuffer,
  );

  // 2. Bọc rawFileKey cho từng thành viên (bao gồm cả chính người gửi)
  const allTargets: Record<string, string> = {
    [params.senderUserId]: myKeyInfo.publicKeyB64,
  };
  for (const [uid, bundle] of Object.entries(params.recipientPublicKeys)) {
    if (bundle?.publicKey) {
      allTargets[uid] = bundle.publicKey;
    }
  }

  const wrappedKeys: Record<string, AttachmentE2EEWrappedKey> = {};
  for (const [uid, pubKeyB64] of Object.entries(allTargets)) {
    try {
      const wrappingKey = await deriveSharedWrappingKey(
        myKeyInfo.privateKeyJwk,
        pubKeyB64,
      );
      const wrapIv = window.crypto.getRandomValues(new Uint8Array(12));
      const wrappedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: wrapIv },
        wrappingKey,
        rawFileKey,
      );
      wrappedKeys[uid] = {
        ivB64: arrayBufferToBase64(wrapIv.buffer),
        wrappedKeyB64: arrayBufferToBase64(wrappedBuffer),
      };
    } catch (err) {
      console.warn(`Skipped E2EE key wrapping for user ${uid}:`, err);
    }
  }

  const encryptedFile = new File([cipherBuffer], params.file.name, {
    type: "application/octet-stream",
  });

  return {
    encryptedFile,
    e2eeMeta: {
      algorithm: "AES-256-GCM",
      fileIvB64: arrayBufferToBase64(fileIv.buffer),
      originalMimeType: params.file.type || "application/octet-stream",
      senderUserId: params.senderUserId,
      senderPublicKeyB64: myKeyInfo.publicKeyB64,
      senderKeyId: myKeyInfo.keyId,
      wrappedKeys,
    },
  };
}

/**
 * Giải mã tệp đính kèm E2EE tải về từ S3/SeaweedFS thành Blob URL cục bộ trên trình duyệt.
 */
export async function decryptAttachmentBlobE2EE(params: {
  encryptedUrl: string;
  currentUserId: string;
  e2eeMeta: AttachmentE2EEMeta;
}): Promise<string | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;

  const myKeyInfo = await getOrCreateDeviceE2EEKey();
  if (!myKeyInfo) return null;

  const myWrapped = params.e2eeMeta.wrappedKeys?.[params.currentUserId];
  if (!myWrapped) return null;

  const wrappingKey = await deriveSharedWrappingKey(
    myKeyInfo.privateKeyJwk,
    params.e2eeMeta.senderPublicKeyB64,
  );

  const rawFileKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(base64ToArrayBuffer(myWrapped.ivB64)),
    },
    wrappingKey,
    base64ToArrayBuffer(myWrapped.wrappedKeyB64),
  );

  const fileCryptoKey = await window.crypto.subtle.importKey(
    "raw",
    rawFileKeyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const response = await fetch(sanitizeMediaUrl(params.encryptedUrl), {
    mode: "cors",
    credentials: "omit",
  });
  if (!response.ok) return null;

  const encryptedBuffer = await response.arrayBuffer();
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(base64ToArrayBuffer(params.e2eeMeta.fileIvB64)),
    },
    fileCryptoKey,
    encryptedBuffer,
  );

  const blob = new Blob([decryptedBuffer], {
    type: params.e2eeMeta.originalMimeType || "application/octet-stream",
  });
  return URL.createObjectURL(blob);
}
