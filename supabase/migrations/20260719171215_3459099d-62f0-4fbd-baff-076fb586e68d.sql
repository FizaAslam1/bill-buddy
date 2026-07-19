
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  bill_month DATE NOT NULL,
  units INTEGER NOT NULL CHECK (units >= 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bills_user_month_idx ON public.bills(user_id, bill_month DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own bills" ON public.bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bills" ON public.bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bills" ON public.bills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bills" ON public.bills FOR DELETE TO authenticated USING (auth.uid() = user_id);
