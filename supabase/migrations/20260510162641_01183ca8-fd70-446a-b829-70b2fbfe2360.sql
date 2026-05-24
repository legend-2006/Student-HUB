
CREATE OR REPLACE FUNCTION public.is_order_buyer(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND buyer_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.order_has_seller_item(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.order_items WHERE order_id = _order_id AND seller_id = _user_id);
$$;

DROP POLICY IF EXISTS "Sellers can view orders containing their items" ON public.orders;
CREATE POLICY "Sellers can view orders containing their items"
ON public.orders FOR SELECT
USING (public.order_has_seller_item(id, auth.uid()));

DROP POLICY IF EXISTS "Buyers can view items of their own orders" ON public.order_items;
CREATE POLICY "Buyers can view items of their own orders"
ON public.order_items FOR SELECT
USING (public.is_order_buyer(order_id, auth.uid()));

DROP POLICY IF EXISTS "Buyers can insert items for their own orders" ON public.order_items;
CREATE POLICY "Buyers can insert items for their own orders"
ON public.order_items FOR INSERT
WITH CHECK (public.is_order_buyer(order_id, auth.uid()));
