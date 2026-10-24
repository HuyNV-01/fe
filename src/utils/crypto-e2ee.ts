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
