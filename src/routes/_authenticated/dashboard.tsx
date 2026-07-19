import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Sparkles, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getBillAdvice } from "@/lib/ai-advice.functions";

type Bill = {
  id: string;
  bill_month: string;
  units: number;
  amount: number;
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { year: "numeric", month: "short" });
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const getAdvice = useServerFn(getBillAdvice);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("id, bill_month, units, amount")
        .eq("user_id", user.id)
        .order("bill_month", { ascending: true });
      if (error) toast.error(error.message);
      else setBills((data ?? []) as Bill[]);
      setLoading(false);
    })();
  }, [user.id]);

  const chartData = bills.map((b) => ({
    month: formatMonth(b.bill_month),
    amount: Number(b.amount),
    units: b.units,
  }));

  const handleAdvice = async () => {
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const res = await getAdvice();
      setAdvice(res.advice);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get AI advice");
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setBills((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bill deleted");
    router.invalidate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your electricity bill history and insights.
          </p>
        </div>
        <Link
          to="/add-bill"
          className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          Add Bill
        </Link>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-semibold">No bills yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first bill to see charts and get AI advice.
          </p>
          <Link
            to="/add-bill"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add your first bill
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold">Amount paid over time (PKR)</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Amount"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-primary)", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Bill history</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Month</th>
                    <th className="px-4 py-3 font-medium">Units (kWh)</th>
                    <th className="px-4 py-3 font-medium">Amount (PKR)</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {[...bills].reverse().map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{formatMonth(b.bill_month)}</td>
                      <td className="px-4 py-3">{b.units.toLocaleString()}</td>
                      <td className="px-4 py-3">PKR {Number(b.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete bill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">AI Bill Advisor</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analyze your last 6 months and get saving tips.
                </p>
              </div>
              <button
                onClick={handleAdvice}
                disabled={adviceLoading}
                className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {adviceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Get AI Advice
              </button>
            </div>

            {advice && (
              <div className="mt-6 rounded-lg border border-primary/20 bg-gradient-to-br from-accent/40 to-transparent p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Your personalized advice
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {advice}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
