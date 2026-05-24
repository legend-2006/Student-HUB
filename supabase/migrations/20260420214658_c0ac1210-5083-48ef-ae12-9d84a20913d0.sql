CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
USING (auth.uid() = seller_id);