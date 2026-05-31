import { useEffect, useState } from "react";
import { api } from "../../api";
import JsonViewer from "../../components/JsonViewer";
import LoadingSpinner from "../../components/LoadingSpinner";

type Feature = {
  name: string;
  status: string;
  description: string;
  surface: string;
};

type PlatformStatus = {
  playground: string;
  contextdb_version: string;
  updated_at: string;
  summary: string;
  features: Feature[];
};

const statusClasses: Record<string, string> = {
  live: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  external: "bg-blue-500/10 text-blue-300 border-blue-500/30",
};

export default function SystemTab() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<unknown>(null);
  const [receipts, setReceipts] = useState<unknown>(null);
  const [explainRank, setExplainRank] = useState<unknown>(null);
  const [busyAction, setBusyAction] = useState("");

  const loadStatus = async () => {
    try {
      setLoading(true);
      setStatus(await api.get<PlatformStatus>("/platform/status"));
      setError("");
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runAction = async (name: string, action: () => Promise<void>) => {
    setBusyAction(name);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setBusyAction("");
    }
  };

  const runAcquisitionPreview = () =>
    runAction("acquisition", async () => {
      setPreview(await api.post("/platform/acquisition-preview", {
        budget: 3,
        max_gaps: 3,
        max_results: 3,
        allowed_source_ids: ["playground/auditor"],
      }));
    });

  const loadReceipts = () =>
    runAction("receipts", async () => {
      setReceipts(await api.get("/platform/acquisition-receipts"));
    });

  const runExplainRank = () =>
    runAction("explain-rank", async () => {
      setExplainRank(await api.post("/platform/explain-rank", {
        text: "Which claim is better supported by reliable evidence?",
      }));
    });

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <LoadingSpinner />
        <span>Loading system surface...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">System Surface</h2>
            <p className="mt-1 text-sm text-gray-400 max-w-3xl">{status?.summary}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">contextdb</div>
            <div className="text-lg font-bold text-indigo-300">{status?.contextdb_version}</div>
            <div className="text-[11px] text-gray-500">{status?.playground}</div>
          </div>
        </div>
        {error && <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {status?.features.map((feature) => (
          <article key={feature.name} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-gray-100">{feature.name}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${statusClasses[feature.status] ?? "border-gray-700 text-gray-400"}`}>
                {feature.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{feature.description}</p>
            <div className="mt-3 text-xs text-gray-500">{feature.surface}</div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ActionPanel
          title="Acquisition Dry-Run"
          description="Preview connector payloads, source allow-lists, and payload hashes without writing nodes."
          action="Run Preview"
          busy={busyAction === "acquisition"}
          onClick={runAcquisitionPreview}
          data={preview}
        />
        <ActionPanel
          title="Receipts and Retry Guidance"
          description="Inspect append-only connector receipts and unresolved retry recommendations."
          action="Load Receipts"
          busy={busyAction === "receipts"}
          onClick={loadReceipts}
          data={receipts}
        />
        <ActionPanel
          title="Explain Rank"
          description="Compare two seeded auditor claims using current score-factor and evidence calculations."
          action="Compare Seeded Claims"
          busy={busyAction === "explain-rank"}
          onClick={runExplainRank}
          data={explainRank}
        />
      </section>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  action,
  busy,
  onClick,
  data,
}: {
  title: string;
  description: string;
  action: string;
  busy: boolean;
  onClick: () => void;
  data: unknown;
}) {
  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="font-semibold text-gray-100">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-gray-400">{description}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-200"
      >
        {busy ? "Working..." : action}
      </button>
      <div className="mt-4">
        {data ? <JsonViewer data={data} collapsed /> : <p className="rounded-lg border border-dashed border-gray-800 p-4 text-sm text-gray-500">No output yet.</p>}
      </div>
    </article>
  );
}
