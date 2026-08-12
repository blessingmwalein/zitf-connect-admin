-- Add event_id to existing ticket_types table

ALTER TABLE public.ticket_types 
ADD COLUMN IF NOT EXISTS event_id UUID NOT NULL DEFAULT 'b0000000-0000-0000-0000-000000000001' 
REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_active ON public.ticket_types(event_id, is_active) WHERE is_active = true;