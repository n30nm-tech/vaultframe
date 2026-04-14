import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const AUTH_SESSION_COOKIE = "vaultframe_session";

type StoredAuthConfig = {
  passwordHash: string;
  updatedAt: string;
};

function getAuthFilePath() {
  if (process.env.APP_AUTH_FILE?.trim()) {
    return process.env.APP_AUTH_FILE.trim();
  }

  const dataDir = process.env.MEDIA_DATA_DIR?.trim() || "/opt/vaultframe-data";
  return path.join(dataDir, "auth.json");
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function readStoredAuthConfig(): Promise<StoredAuthConfig | null> {
  try {
    const raw = await readFile(getAuthFilePath(), "utf8");
    const parsed = JSON.parse(raw) as StoredAuthConfig;

    if (!parsed.passwordHash) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function getCurrentPasswordHash() {
  const storedConfig = await readStoredAuthConfig();

  if (storedConfig?.passwordHash) {
    return storedConfig.passwordHash;
  }

  if (process.env.APP_PASSWORD?.trim()) {
    return hashPassword(process.env.APP_PASSWORD.trim());
  }

  return null;
}

export async function isAuthConfigured() {
  return Boolean(process.env.APP_SESSION_SECRET && (await getCurrentPasswordHash()));
}

export async function verifyPassword(password: string) {
  const expectedHash = await getCurrentPasswordHash();

  if (!expectedHash) {
    return false;
  }

  const providedHash = hashPassword(password);
  return timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash));
}

export async function getExpectedSessionToken() {
  const passwordHash = await getCurrentPasswordHash();
  const secret = process.env.APP_SESSION_SECRET ?? "";
  const payload = `${secret}:${passwordHash ?? ""}:vaultframe`;

  return createHash("sha256").update(payload).digest("hex");
}

export async function getIsAuthenticated(cookieValue?: string | null) {
  if (!(await isAuthConfigured())) {
    return true;
  }

  if (!cookieValue) {
    return false;
  }

  const expectedToken = await getExpectedSessionToken();
  return cookieValue === expectedToken;
}

export async function requirePageAuth(nextPath: string) {
  const cookieStore = await cookies();
  const authenticated = await getIsAuthenticated(cookieStore.get(AUTH_SESSION_COOKIE)?.value);

  if (!authenticated) {
    const encodedNextPath = encodeURIComponent(nextPath.startsWith("/") ? nextPath : "/");
    redirect(`/login?next=${encodedNextPath}`);
  }
}

export async function assertRequestAuthenticated(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.slice(`${AUTH_SESSION_COOKIE}=`.length);

  return getIsAuthenticated(cookieValue);
}

export async function updateAppPassword(nextPassword: string) {
  const trimmedPassword = nextPassword.trim();

  if (!trimmedPassword) {
    throw new Error("Password is required.");
  }

  const authFilePath = getAuthFilePath();
  await mkdir(path.dirname(authFilePath), { recursive: true });
  await writeFile(
    authFilePath,
    JSON.stringify(
      {
        passwordHash: hashPassword(trimmedPassword),
        updatedAt: new Date().toISOString(),
      } satisfies StoredAuthConfig,
      null,
      2,
    ),
    "utf8",
  );
}
