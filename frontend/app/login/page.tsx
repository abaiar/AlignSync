"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, AlertTriangle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth, UserInfo } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserInfo;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/api/auth/login", {
        username,
        password,
      });
      login(data.access_token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("登录失败，请检查网络或联系管理员");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
      {/* Left — brand panel with blueprint grid */}
      <section className="grid-bg relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-accent/50 bg-accent/10">
              <Crosshair className="h-5 w-5 text-accent" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-fg-primary">
              AlignSync
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Industrial Collaboration
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-fg-primary">
            车轮定位仪
            <br />
            生产协同管理系统
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-fg-secondary">
            核心技术与制造协同 — 相机标定同步、软件锁授权、采购发货全流程追溯。
          </p>
        </div>

        <div className="relative font-mono text-[10px] uppercase tracking-widest text-fg-muted">
          SYS / v1.0 · Precision Alignment Platform
        </div>
      </section>

      {/* Right — login form */}
      <section className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center border border-accent/50 bg-accent/10">
                <Crosshair className="h-4 w-4 text-accent" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight">
                AlignSync
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-fg-secondary">
              {"// Sign In"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-fg-primary">
              访问控制台
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="用户名"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
            />
            <Input
              label="密码"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
            />

            {error && (
              <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  认证中…
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            Authorized access only · 所有操作均被记录
          </p>
        </div>
      </section>
    </main>
  );
}
