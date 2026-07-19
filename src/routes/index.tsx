import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Zap, TrendingDown, Sparkles, LineChart as LineChartIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Bill Advisor</span>
        </div>
        <Link
          to="/auth"
          className="inline-flex items-center rounded-md bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered for Pakistani households
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Track your bills.{" "}
            <span className="text-brand-gradient">Slash your bijli.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Log your monthly electricity bills in PKR, watch trends over time, and get
            personalized AI advice on how to save on your next bill.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center rounded-md bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: LineChartIcon, title: "Visualize trends", desc: "See how your bill changes month over month with a clean chart." },
            { icon: Sparkles, title: "AI advice", desc: "Get 2-3 practical, Pakistan-specific tips to lower your next bill." },
            { icon: TrendingDown, title: "Estimate next bill", desc: "Predict what next month's bill will look like based on your usage." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
