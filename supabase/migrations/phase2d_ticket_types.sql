-- ============================================================
-- Phase 2D: Ticket Types
-- ============================================================
-- Depends on: phase0_multievent_foundation.sql
-- Creates ticket_types table for managing event tickets

CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  ticket_category TEXT NOT NULL CHECK (ticket_category IN ('visitor', 'exhibitor')),
  max_quantity INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX idx_ticket_types_active ON public.ticket_types(event_id, is_active) WHERE is_active = true;

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_types_select" ON public.ticket_types FOR SELECT USING (true);
CREATE POLICY "ticket_types_insert" ON public.ticket_types FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ticket_types_update" ON public.ticket_types FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ticket_types_delete" ON public.ticket_types FOR DELETE USING (auth.uid() IS NOT NULL);
