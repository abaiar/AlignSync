"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

type SyncMode = "single" | "batch";

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

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false, error: "JSON 格式无效" };
  }
}

const textareaClass =
  "w-full rounded border border-border bg-surface-elevated px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

export default function CameraSyncPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SyncMode>("single");

  // Single sync state
  const [sn, setSn] = useState("");
  const [model, setModel] = useState("");
  const [intrinsics, setIntrinsics] = useState("");
  const [extrinsics, setExtrinsics] = useState("");
  const [overwrite, setOverwrite] = useState(false);

  // Batch sync state
  const [batchText, setBatchText] = useState("");

  // Submission state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSingleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!sn.trim()) {
      setError("请输入相机 SN");
      return;
    }
    const intra = tryParseJson(intrinsics);
    if (!intra.ok) {
      setError(`内参 JSON 错误：${intra.error}`);
      return;
    }
    const extra = tryParseJson(extrinsics);
    if (!extra.ok) {
      setError(`外参 JSON 错误：${extra.error}`);
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/cameras/sync", {
        sn: sn.trim(),
        model: model.trim() || null,
        intrinsics: intra.value,
        extrinsics: extra.value,
        overwrite,
      });
      setSuccess(`相机 ${sn.trim()} 同步成功`);
      setSn("");
      setModel("");
      setIntrinsics("");
      setExtrinsics("");
      setOverwrite(false);
    } catch (err) {
      setError(extractError(err, "同步失败，请重试"));
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const sns = batchText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (sns.length === 0) {
      setError("请输入至少一个 SN");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{created?: number; updated?: number; total?: number}>(
        "/api/cameras/batch-sync",
        { cameras: sns.map((s) => ({ sn: s })) },
      );
      const summary =
        typeof data === "object" && data
          ? `共 ${data.total ?? sns.length} 台，新增 ${data.created ?? 0}，更新 ${data.updated ?? 0}`
          : `批量同步 ${sns.length} 台相机完成`;
      setSuccess(summary);
      setBatchText("");
    } catch (err) {
      setError(extractError(err, "批量同步失败，请重试"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="同步相机"
        description="将相机标定数据同步至平台。"
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {/* Mode toggle */}
      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: "single", label: "单个同步", icon: Upload },
            { key: "batch", label: "批量同步", icon: Layers },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setError(null);
              setSuccess(null);
            }}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              mode === key
                ? "border-accent text-fg-primary"
                : "border-transparent text-fg-secondary hover:text-fg-primary",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
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

      {mode === "single" ? (
        <Card>
          <CardHeader>
            <CardTitle>单个同步</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="SN"
                  name="sn"
                  required
                  value={sn}
                  onChange={(e) => setSn(e.target.value)}
                  placeholder="相机序列号"
                />
                <Input
                  label="型号"
                  name="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="相机型号"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  内参 (JSON)
                </label>
                <textarea
                  className={cn(textareaClass, "min-h-[120px]")}
                  value={intrinsics}
                  onChange={(e) => setIntrinsics(e.target.value)}
                  placeholder='{"fx": 0, "fy": 0, "cx": 0, "cy": 0}'
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  外参 (JSON)
                </label>
                <textarea
                  className={cn(textareaClass, "min-h-[120px]")}
                  value={extrinsics}
                  onChange={(e) => setExtrinsics(e.target.value)}
                  placeholder='{"rvec": [0,0,0], "tvec": [0,0,0]}'
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-fg-secondary">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                覆盖已存在的标定数据
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      同步中…
                    </>
                  ) : (
                    "提交同步"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>批量同步</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBatchSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  相机 SN 列表（每行一个）
                </label>
                <textarea
                  className={cn(textareaClass, "min-h-[200px]")}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={"SN001\nSN002\nSN003"}
                />
                <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                  {"// 平台将根据 SN 自动获取标定数据"}
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      批量同步中…
                    </>
                  ) : (
                    "开始批量同步"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
