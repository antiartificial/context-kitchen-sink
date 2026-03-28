import { useState, useCallback } from "react";
import { api, ApiError } from "../api";

type Method = "get" | "post";

export function useApi<T>(method: Method, path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (body?: unknown) => {
      setLoading(true);
      setError(null);
      try {
        const result =
          method === "get"
            ? await api.get<T>(path)
            : await api.post<T>(path, body);
        setData(result);
        return result;
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : String(e);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [method, path],
  );

  return { data, loading, error, execute };
}
