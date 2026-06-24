"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export default function SoftwareLockSyncPage() {
  const router = useRouter();
  const [lockId, setLockId] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [boundEnterpriseId, setBoundEnterpriseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!lockId.trim()) {
      setError("请输入软件锁 ID");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        lock_id: lockId.trim(),
        overwrite,
      };
      const entId = boundEnterpriseId.trim();
      if (entId) {
        const parsed = Number(entId);
        if (!Number.isNaN(parsed)) {
          body.bound_enterprise_id = parsed;
        }
      }
      await api.post("/api/software-locks/sync", body);
      setSuccess(`软件锁 ${lockId.trim()} 同步成功`);
      setLockId("");
      setOverwrite(false);
      setBoundEnterpriseId("");
    } catch (err) {
      setError(extractError(err, "同步失败，请重试"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="同步授权"
        description="将软件锁授权信息同步至平台。"
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {success && (
        <div className="flex items-start gap-2 border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>授权同步</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="软件锁 ID"
              name="lock_id"
              required
              value={lockId}
              onChange={(e) => setLockId(e.target.value)}
              placeholder="输入软件锁 ID"
            />
            <Input
              label="绑定企业 ID（可选）"
              name="bound_enterprise_id"
              type="number"
              value={boundEnterpriseId}
              onChange={(e) => setBoundEnterpriseId(e.target.value)}
              placeholder="留空表示不绑定"
            />
            <label className="flex items-center gap-2 text-sm text-fg-secondary">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              覆盖已存在的授权数据
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    同步中…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    提交同步
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
