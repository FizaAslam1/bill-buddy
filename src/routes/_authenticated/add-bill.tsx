import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/add-bill")({
  component: AddBill,
});

function AddBill() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [units, setUnits] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("bills").insert({
        user_id: user.id,
        bill_month: `${month}-01`,
        units: parseInt(units, 10),
        amount: parseFloat(amount),
      });
      if (error) throw error;
      toast.success("Bill added!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Bill</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log a new monthly electricity bill.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Units consumed (kWh)</label>
            <input
              type="number"
              required
              min={0}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="e.g. 350"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Amount paid (PKR)</label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              placeholder="e.g. 8500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Save bill
          </button>
        </div>
      </form>
    </div>
  );
}
