
-- Subscription plans for sellers
CREATE TABLE public.seller_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('basic','pro','premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  activated_by UUID,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own subscription"
ON public.seller_subscriptions FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Anyone authenticated can view subscription status"
ON public.seller_subscriptions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert subscriptions"
ON public.seller_subscriptions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subscriptions"
ON public.seller_subscriptions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions"
ON public.seller_subscriptions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER seller_subscriptions_updated_at
BEFORE UPDATE ON public.seller_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is seller subscription active?
CREATE OR REPLACE FUNCTION public.is_seller_subscribed(_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.seller_subscriptions
    WHERE seller_id = _seller_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Conversations between buyer and seller
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  product_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, seller_id, product_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Participants can create conversations if seller subscribed"
ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = buyer_id OR auth.uid() = seller_id)
  AND public.is_seller_subscribed(seller_id)
);

CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)
  )
);

CREATE POLICY "Participants can send messages if seller subscribed"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)
      AND public.is_seller_subscribed(c.seller_id)
  )
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_conversations_buyer ON public.conversations(buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON public.conversations(seller_id, last_message_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
