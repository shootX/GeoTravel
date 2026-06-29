import { CookieOptions, Response } from "express";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE_MS,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_MS,
} from "./tokens";

function baseCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  csrfToken: string
): void {
  res.cookie(ACCESS_COOKIE, accessToken, baseCookieOptions(ACCESS_MAX_AGE_MS));
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(REFRESH_MAX_AGE_MS),
    path: "/api/auth",
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

export function setOAuthStateCookie(res: Response, state: string): void {
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/api/auth",
  });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie("oauth_state", { path: "/api/auth" });
}
