import { useState, useCallback, useEffect } from "react";
import { api, ApiError } from "../api";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await api.get<{ authenticated: boolean }>("/auth/check");
      setAuthenticated(res.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  const login = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post<{ ok: boolean }>("/auth/login", { password });
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 429
        ? "Too many attempts. Try again later."
        : "Invalid password.");
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setAuthenticated(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  return { authenticated, error, loading, login, logout };
}
