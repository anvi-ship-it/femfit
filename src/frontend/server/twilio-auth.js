import { createHmac, timingSafeEqual } from "node:crypto";
import twilio from "twilio";

const SESSION_COOKIE = "femfit_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 8_192;
const sendWindows = new Map();

function json(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  if (request.body && typeof request.body === "object") return request.body;

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large.");
    chunks.push(chunk);
  }

  if (size === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const host = request.headers["x-forwarded-host"] ?? request.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("Twilio Verify is not configured.");
  }
  return { client: twilio(accountSid, authToken), serviceSid };
}

function normalizePhone(value) {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  return typeof secret === "string" && secret.length >= 32 ? secret : null;
}

function signatureFor(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSession(phone, secret) {
  const payload = Buffer.from(
    JSON.stringify({
      phone,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${signatureFor(payload, secret)}`;
}

function readSession(request, secret) {
  const cookieHeader = request.headers.cookie ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signatureFor(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      typeof session.phone !== "string" ||
      typeof session.exp !== "number" ||
      session.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { phone: session.phone };
  } catch {
    return null;
  }
}

function setSessionCookie(response, value) {
  const attributes = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1")
    attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(response) {
  const attributes = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1")
    attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function checkMethod(request, response, method) {
  if (request.method === method) return true;
  response.setHeader("Allow", method);
  json(response, 405, { error: "Method not allowed." });
  return false;
}

function checkOrigin(request, response) {
  if (isSameOrigin(request)) return true;
  json(response, 403, { error: "Request origin is not allowed." });
  return false;
}

function rateLimitPhone(phone) {
  const now = Date.now();
  const recent = (sendWindows.get(phone) ?? []).filter(
    (timestamp) => now - timestamp < 10 * 60 * 1000,
  );
  if (
    recent.length >= 3 ||
    (recent.length > 0 && now - recent[recent.length - 1] < 30_000)
  ) {
    sendWindows.set(phone, recent);
    return false;
  }
  recent.push(now);
  sendWindows.set(phone, recent);
  return true;
}

export async function requestCode(request, response) {
  if (
    !checkMethod(request, response, "POST") ||
    !checkOrigin(request, response)
  )
    return;

  let body;
  try {
    body = await readJson(request);
  } catch {
    json(response, 400, { error: "Send a valid JSON request." });
    return;
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    json(response, 400, {
      error: "Enter a valid phone number in international format.",
    });
    return;
  }
  if (!rateLimitPhone(phone)) {
    json(response, 429, {
      error: "Too many code requests. Please wait before trying again.",
    });
    return;
  }

  try {
    const { client, serviceSid } = getTwilioClient();
    await client.verify.v2.services(serviceSid).verifications.create({
      to: phone,
      channel: "sms",
    });
    json(response, 200, { sent: true });
  } catch (error) {
    console.error("[Twilio Verify] Could not send a verification code.", error);
    const status = error?.status === 429 ? 429 : 502;
    json(response, status, {
      error:
        status === 429
          ? "Too many code requests. Please wait before trying again."
          : "We could not send a code right now. Please try again later.",
    });
  }
}

export async function verifyCode(request, response) {
  if (
    !checkMethod(request, response, "POST") ||
    !checkOrigin(request, response)
  )
    return;

  let body;
  try {
    body = await readJson(request);
  } catch {
    json(response, 400, { error: "Send a valid JSON request." });
    return;
  }

  const phone = normalizePhone(body.phone);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!phone || !/^\d{4,10}$/.test(code)) {
    json(response, 400, {
      error: "Enter a valid phone number and verification code.",
    });
    return;
  }

  const secret = getSessionSecret();
  if (!secret) {
    json(response, 503, { error: "Authentication is not configured yet." });
    return;
  }

  try {
    const { client, serviceSid } = getTwilioClient();
    const result = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });
    if (result.status !== "approved") {
      json(response, 400, {
        error:
          "That code is incorrect or expired. Request a new one and try again.",
      });
      return;
    }

    setSessionCookie(response, createSession(phone, secret));
    json(response, 200, { authenticated: true, phone });
  } catch (error) {
    console.error("[Twilio Verify] Could not verify the code.", error);
    json(response, 502, {
      error: "We could not verify that code right now. Please try again.",
    });
  }
}

export function getSession(request, response) {
  if (!checkMethod(request, response, "GET")) return;
  const secret = getSessionSecret();
  const session = secret ? readSession(request, secret) : null;
  json(response, 200, {
    authenticated: Boolean(session),
    phone: session?.phone ?? null,
  });
}

export function deleteSession(request, response) {
  if (
    !checkMethod(request, response, "DELETE") ||
    !checkOrigin(request, response)
  )
    return;
  clearSessionCookie(response);
  json(response, 200, { authenticated: false, phone: null });
}
