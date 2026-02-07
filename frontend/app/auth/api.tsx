export const API_BASE = "http://localhost:8000/api";
// export const API_BASE = "https://argue-anonymous-attempt-hosts.trycloudflare.com/api";
export const ADMIN_API_BASE = `${API_BASE}/admin`;
export const AUTH_API_BASE = API_BASE;

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
export const adminApiUrl = (path: string) =>
	`${ADMIN_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
