import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "vaultframe_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type StoredPasswordRecord = {
  passwordHash: string;
  passwordSalt: string;
  updatedAt: string;
};

function getAuthDataDir() {
  return process.env.APP_DATA_DIR || process.env.MEDIA_DATA_DIR || "/opt/vaultframe-data";
}

function getPasswordFilePath() {
  return path.join(getAuthDataDir(), "auth", "password.json");
}

function getRecoveryPassword() {
  return process.env.APP_PASSWORD?.trim() ?? "";
}

async function readStoredPasswordRecord(): Promise<StoredPasswordRecord | null> {
  try {
    const content = await readFile(getPasswordFilePath(), "utf8");
    return JSON.parse(content) as StoredPasswordRecord;
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function getSessionSecret(storedRecord: StoredPasswordRecord | null) {
  return (
    process.env.APP_SESSION_SECRET?.trim() ||
    getRecoveryPassword() ||
    storedRecord?.passwordHash ||
    "vaultframe-fallback-secret"
  );
}

function signSessionPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionValue(secret: string) {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + SESSION_TTL_MS,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

function verifySessionValue(value: string, secret: string) {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expected = signSessionPayload(payload, secret);

  try {
    if (
      !timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      )
    ) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAuthEnabled() {
  const storedRecord = await readStoredPasswordRecord();
  return Boolean(storedRecord || getRecoveryPassword());
}

export async function getAuthOverview() {
  const storedRecord = await readStoredPasswordRecord();
  const recoveryPasswordSet = Boolean(getRecoveryPassword());

  return {
    enabled: Boolean(storedRecord || recoveryPasswordSet),
    hasSavedPassword: Boolean(storedRecord),
    recoveryPasswordSet,
    passwordFilePath: getPasswordFilePath(),
  };
}

export async function verifyAppPassword(password: string) {
  const candidate = password.trim();

  if (!candidate) {
    return false;
  }

  const storedRecord = await readStoredPasswordRecord();

  if (storedRecord) {
    const storedHash = hashPassword(candidate, storedRecord.passwordSalt);

    if (timingSafeEqual(Buffer.from(storedHash), Buffer.from(storedRecord.passwordHash))) {
      return true;
    }
  }

  const recoveryPassword = getRecoveryPassword();
  return Boolean(recoveryPassword) && candidate === recoveryPassword;
}

export async function createAuthenticatedSession() {
  const storedRecord = await readStoredPasswordRecord();
  return createSessionValue(getSessionSecret(storedRecord),);
}

export async function isAuthenticated() {
  if (!(await isAuthEnabled())) {
    return true;
  }

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return false;
  }

  const storedRecord = await readStoredPasswordRecord();
  return verifySessionValue(sessionValue, getSessionSecret(storedRecord));
}

export async function requirePageAuth(returnTo: string) {
  if (!(await isAuthEnabled())) {
    return;
  }

  if (await isAuthenticated()) {
    return;
  }

  redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function assertAuthenticated() {
  if (!(await isAuthenticated())) {
    throw new Error("Authentication required.");
  }
}

export async function storeNewPassword(password: string) {
  const trimmedPassword = password.trim();

  if (!trimmedPassword) {
    throw new Error("Password cannot be empty.");
  }

  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(trimmedPassword, passwordSalt);
  const filePath = getPasswordFilePath();

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        passwordHash,
        passwordSalt,
        updatedAt: new Date().toISOString(),
      } satisfies StoredPasswordRecord,
      null,
      2,
    ),
    "utf8",
  );
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    ...getSessionCookieOptions(),
    maxAge: 0,
  };
}
