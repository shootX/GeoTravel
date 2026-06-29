import crypto from "crypto";
import { prisma } from "../db";
import {
  createRefreshToken,
  generateCsrfToken,
  signAccessToken,
} from "./tokens";
import { setAuthCookies } from "./cookies";
import { sanitizeUser } from "./middleware";
import { Response } from "express";

export type OAuthProvider = "google" | "facebook";

interface OAuthProfile {
  providerUserId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function issueAuthSession(
  res: Response,
  userId: string,
  email: string
): Promise<void> {
  const accessToken = signAccessToken(userId, email);
  const refreshToken = await createRefreshToken(userId);
  const csrfToken = generateCsrfToken();
  setAuthCookies(res, accessToken, refreshToken, csrfToken);
}

export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  profile: OAuthProfile
): Promise<{ id: string; email: string }> {
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId: profile.providerUserId,
      },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    await prisma.user.update({
      where: { id: existingOAuth.userId },
      data: {
        name: profile.name ?? existingOAuth.user.name,
        avatarUrl: profile.avatarUrl ?? existingOAuth.user.avatarUrl,
        emailVerified: profile.emailVerified || existingOAuth.user.emailVerified,
      },
    });
    return { id: existingOAuth.userId, email: existingOAuth.user.email };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email.toLowerCase() },
  });

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider,
        providerUserId: profile.providerUserId,
      },
    });
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: existingUser.name ?? profile.name,
        avatarUrl: existingUser.avatarUrl ?? profile.avatarUrl,
        emailVerified: existingUser.emailVerified || profile.emailVerified,
      },
    });
    return { id: existingUser.id, email: existingUser.email };
  }

  const user = await prisma.user.create({
    data: {
      email: profile.email.toLowerCase(),
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
      oauthAccounts: {
        create: {
          provider,
          providerUserId: profile.providerUserId,
        },
      },
    },
  });

  return { id: user.id, email: user.email };
}

export async function fetchGoogleProfile(code: string): Promise<OAuthProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured");
  }

  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Google authorization code");
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  const profile = (await profileRes.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };

  if (!profile.email) {
    throw new Error("Google account has no email");
  }

  return {
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
    emailVerified: profile.email_verified ?? false,
  };
}

export async function fetchFacebookProfile(code: string): Promise<OAuthProfile> {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Facebook OAuth is not configured");
  }

  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) {
    throw new Error("Failed to exchange Facebook authorization code");
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  profileUrl.searchParams.set("access_token", tokenData.access_token);

  const profileRes = await fetch(profileUrl);
  if (!profileRes.ok) {
    throw new Error("Failed to fetch Facebook user profile");
  }

  const profile = (await profileRes.json()) as {
    id: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };

  if (!profile.email) {
    throw new Error("Facebook account has no email");
  }

  return {
    providerUserId: profile.id,
    email: profile.email,
    name: profile.name ?? null,
    avatarUrl: profile.picture?.data?.url ?? null,
    emailVerified: true,
  };
}

export { sanitizeUser };
