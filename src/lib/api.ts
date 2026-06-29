function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const csrf = getCookie("csrf_token");
  const headers = new Headers(init.headers);
  const url = String(input);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (csrf) {
    headers.set("X-CSRF-Token", csrf);
  }

  let response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  const isAuthMutation =
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/logout");

  if (response.status === 401 && !url.includes("/api/auth/refresh") && !isAuthMutation) {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (refreshed.ok) {
      const newCsrf = getCookie("csrf_token");
      if (newCsrf) {
        headers.set("X-CSRF-Token", newCsrf);
      }
      response = await fetch(input, {
        ...init,
        credentials: "include",
        headers,
      });
    }
  }

  return response;
}
