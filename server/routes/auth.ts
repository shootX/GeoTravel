import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/db";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../lib/auth/passwords";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  generateCsrfToken,
  rotateRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "../lib/auth/tokens";
import { clearAuthCookies, clearOAuthStateCookie, setAuthCookies, setOAuthStateCookie } from "../lib/auth/cookies";
import { requireAuth, requireCsrf, sanitizeUser } from "../lib/auth/middleware";
import {
  fetchFacebookProfile,
  fetchGoogleProfile,
  findOrCreateOAuthUser,
  generateOAuthState,
  getAppUrl,
  issueAuthSession,
} from "../lib/auth/oauth";

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

async function sendAuthResponse(res: Response, userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });

  if (!user) {
    res.status(500).json({ error: "User not found" });
    return;
  }

  await issueAuthSession(res, userId, email);
  res.json({ user: sanitizeUser(user) });
}

authRouter.post("/register", authLimiter, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }

  const { email, password, name } = parsed.data;
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name ?? null,
      emailVerified: false,
    },
  });

  await sendAuthResponse(res, user.id, user.email);
});

authRouter.post("/login", authLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user?.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await sendAuthResponse(res, user.id, user.email);
});

authRouter.post("/logout", requireAuth, requireCsrf, async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

authRouter.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) {
    clearAuthCookies(res);
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user) {
    clearAuthCookies(res);
    res.status(401).json({ error: "User not found" });
    return;
  }

  const accessToken = signAccessToken(user.id, user.email);
  const csrfToken = generateCsrfToken();
  setAuthCookies(res, accessToken, rotated.refreshToken, csrfToken);
  res.json({ user: sanitizeUser(user) });
});

authRouter.get("/me", async (req: Request, res: Response) => {
  const select = { id: true, email: true, name: true, avatarUrl: true, role: true } as const;

  const accessToken = req.cookies?.[ACCESS_COOKIE];
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.sub }, select });
      if (user) {
        res.json({ user: sanitizeUser(user) });
        return;
      }
    }
  }

  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    const rotated = await rotateRefreshToken(refreshToken);
    if (rotated) {
      const user = await prisma.user.findUnique({ where: { id: rotated.userId }, select });
      if (user) {
        const newAccess = signAccessToken(user.id, user.email);
        const csrfToken = generateCsrfToken();
        setAuthCookies(res, newAccess, rotated.refreshToken, csrfToken);
        res.json({ user: sanitizeUser(user) });
        return;
      }
    }
    clearAuthCookies(res);
  }

  res.json({ user: null });
});

authRouter.get("/google", (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "Google OAuth is not configured" });
    return;
  }

  const state = generateOAuthState();
  setOAuthStateCookie(res, state);

  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  res.redirect(url.toString());
});

authRouter.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.oauth_state;

    if (!code || typeof code !== "string" || !state || typeof state !== "string" || state !== savedState) {
      res.redirect(`${getAppUrl()}/?auth_error=invalid_state`);
      return;
    }

    clearOAuthStateCookie(res);
    const profile = await fetchGoogleProfile(code);
    const user = await findOrCreateOAuthUser("google", profile);
    await issueAuthSession(res, user.id, user.email);
    res.redirect(`${getAppUrl()}/?auth=success`);
  } catch {
    res.redirect(`${getAppUrl()}/?auth_error=google_failed`);
  }
});

authRouter.get("/facebook", (_req: Request, res: Response) => {
  const clientId = process.env.FACEBOOK_APP_ID;
  if (!clientId) {
    res.status(503).json({ error: "Facebook OAuth is not configured" });
    return;
  }

  const state = generateOAuthState();
  setOAuthStateCookie(res, state);

  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "email,public_profile");
  url.searchParams.set("response_type", "code");

  res.redirect(url.toString());
});

authRouter.get("/facebook/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.oauth_state;

    if (!code || typeof code !== "string" || !state || typeof state !== "string" || state !== savedState) {
      res.redirect(`${getAppUrl()}/?auth_error=invalid_state`);
      return;
    }

    clearOAuthStateCookie(res);
    const profile = await fetchFacebookProfile(code);
    const user = await findOrCreateOAuthUser("facebook", profile);
    await issueAuthSession(res, user.id, user.email);
    res.redirect(`${getAppUrl()}/?auth=success`);
  } catch {
    res.redirect(`${getAppUrl()}/?auth_error=facebook_failed`);
  }
});

export default authRouter;
