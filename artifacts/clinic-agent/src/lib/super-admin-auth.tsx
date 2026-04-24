import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SuperAdminContextType {
  isAdmin: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | null>(null);

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/super-admin/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIsAdmin(data?.isSuperAdmin === true))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  const login = async (password: string) => {
    const res = await fetch(`${API_BASE}/super-admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Login failed");
    }
    setIsAdmin(true);
  };

  const logout = async () => {
    await fetch(`${API_BASE}/super-admin/logout`, { method: "POST", credentials: "include" });
    setIsAdmin(false);
  };

  return (
    <SuperAdminContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error("useSuperAdmin must be used within SuperAdminProvider");
  return ctx;
}

export const SUPER_ADMIN_API = API_BASE;
