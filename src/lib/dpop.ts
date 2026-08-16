import { base64urlEncode } from "./base64";

export interface DPoPKeyPair {
  privateKey: CryptoKey;
  publicKey: JsonWebKey;
  keyId: string;
  createdAt: number;
}

export interface DPoPProof {
  proof: string;
  header: string;
}

const STORAGE_KEY = "clavis_dpop_key";
const DEFAULT_ROTATION_PERIOD_MS = 24 * 60 * 60 * 1000;

export function setRotationPeriod(ms: number): void {
  rotationPeriod = ms;
}

let rotationPeriod = DEFAULT_ROTATION_PERIOD_MS;

export async function generateDPoPKeyPair(): Promise<DPoPKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const keyId = generateKeyId();

  return {
    privateKey: keyPair.privateKey,
    publicKey: publicKeyJwk!,
    keyId,
    createdAt: Date.now(),
  };
}

function generateKeyId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function storeDPoPKeyPair(keyPair: DPoPKeyPair): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        publicKey: keyPair.publicKey,
        keyId: keyPair.keyId,
        createdAt: keyPair.createdAt,
      })
    );
  }
}

export async function getStoredDPoPKey(): Promise<DPoPKeyPair | null> {
  if (typeof window === "undefined") return null;

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const { publicKey, keyId, createdAt } = JSON.parse(stored);
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    return {
      privateKey: keyPair.privateKey,
      publicKey,
      keyId,
      createdAt: createdAt || Date.now(),
    };
  } catch {
    return null;
  }
}

export function isKeyExpired(keyPair: DPoPKeyPair): boolean {
  const age = Date.now() - keyPair.createdAt;
  return age > rotationPeriod;
}

export function getKeyAge(keyPair: DPoPKeyPair): number {
  return Date.now() - keyPair.createdAt;
}

export function getTimeUntilRotation(keyPair: DPoPKeyPair): number {
  const age = Date.now() - keyPair.createdAt;
  return Math.max(0, rotationPeriod - age);
}

export async function rotateDPoPKey(): Promise<DPoPKeyPair> {
  console.log("[DPoP] Rotating key pair...");
  const newKeyPair = await generateDPoPKeyPair();
  await storeDPoPKeyPair(newKeyPair);
  console.log(`[DPoP] New key generated: ${newKeyPair.keyId}`);
  return newKeyPair;
}

export async function getOrCreateDPoPKeyPair(): Promise<DPoPKeyPair> {
  const stored = await getStoredDPoPKey();
  
  if (stored && !isKeyExpired(stored)) {
    return stored;
  }

  if (stored && isKeyExpired(stored)) {
    console.log("[DPoP] Key expired, rotating...");
    return rotateDPoPKey();
  }

  console.log("[DPoP] No existing key, generating new...");
  const newKeyPair = await generateDPoPKeyPair();
  await storeDPoPKeyPair(newKeyPair);
  return newKeyPair;
}

export async function getValidDPoPKey(): Promise<DPoPKeyPair> {
  const keyPair = await getOrCreateDPoPKeyPair();
  
  if (isKeyExpired(keyPair)) {
    return rotateDPoPKey();
  }
  
  return keyPair;
}

export async function createDPoPProof(
  method: string,
  url: string,
  accessToken?: string
): Promise<DPoPProof> {
  const keyPair = await getValidDPoPKey();
  const jti = generateKeyId();
  const iat = Math.floor(Date.now() / 1000);

  const header = {
    alg: "ES256",
    typ: "dpop+jwt",
    jwk: keyPair.publicKey,
  };

  const payload: Record<string, unknown> = {
    jti,
    iat,
    htm: method.toUpperCase(),
    htu: url,
  };

  if (accessToken) {
    const ath = await hashAccessToken(accessToken);
    payload.ath = ath;
  }

  const headerBase64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadBase64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerBase64}.${payloadBase64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );

  const signatureBase64 = base64urlEncode(new Uint8Array(signature));
  const proof = `${signingInput}.${signatureBase64}`;

  return {
    proof,
    header: `DPoP kid="${keyPair.keyId}", alg=ES256`,
  };
}

async function hashAccessToken(token: string): Promise<string> {
  const tokenBytes = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
  const hashArray = new Uint8Array(hashBuffer);
  return base64urlEncode(hashArray);
}

export function clearDPoPKeys(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log("[DPoP] Keys cleared from storage");
  }
}
