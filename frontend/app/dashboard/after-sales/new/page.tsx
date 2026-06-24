"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Camera,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

type Category = "camera" | "software";

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

const TYPE_OPTIONS: Record<Category, { value: string; label: string }[]> = {
  camera: [
    { value: "camera_repair", label: "返修" },
    { value: "camera_replace", label: "更换" },
    { value: "camera_return", label: "退货" },
  ],
  software: [
    { value: "software_upgrade", label: "升级" },
    { value: "software_reactivate", label: "重新激活" },
    { value: "software_replace", label: "更换" },
    { value: "software_return", label: "退货" },
  ],
};

const textareaClass =
  "w-full rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const selectClass =
  "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

export default function NewAfterSalesPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("camera");
  const [type, setType] = useState("camera_repair");
  const [itemSn, setItemSn] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(next: Category) {
    setCategory(next);
    // Reset type to first option of new category
    setType(TYPE_OPTIONS[next][0].value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!itemSn.trim()) {
      setError("请输入物品SN");
      return;
    }
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    if (!description.trim()) {
      setError("请输入问题描述");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, string> = {
        type,
        category,
        item_sn: itemSn.trim(),
        title: title.trim(),
        description: description.trim(),
      };
      if (deviceId.trim()) body.device_id = deviceId.trim();
      const { data } = await api.post<{ id: number }>("/api/after-sales", body);
      router.push(`/dashboard/after-sales/${data.id}`);
    } catch (err) {
      setError(extractError(err, "创建工单失败，请重试"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="新建售后工单"
        description="提交相机或软件售后工单。"
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>工单信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category radio */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                类别
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { key: "camera", label: "相机", icon: Camera },
                    { key: "software", label: "软件", icon: KeyRound },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key)}
                    className={cn(
                      "flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-colors",
                      category === key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-fg-secondary hover:text-fg-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type select */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                类型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={selectClass}
              >
                {TYPE_OPTIONS[category].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="物品SN"
                name="item_sn"
                required
                value={itemSn}
                onChange={(e) => setItemSn(e.target.value)}
                placeholder={
                  category === "camera" ? "相机 SN" : "软件锁 ID"
                }
              />
              <Input
                label="设备ID（可选）"
                name="device_id"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="关联设备ID"
              />
            </div>

            <Input
              label="标题"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="简要描述问题"
            />

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                问题描述
              </label>
              <textarea
                className={cn(textareaClass, "min-h-[160px]")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细描述故障现象、发生时间、复现步骤等"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    提交中…
                  </>
                ) : (
                  "提交工单"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
