
-- Fix 1: Profiles - restrict public read to authenticated users only (was USING true)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: user_roles - prevent privilege escalation. Only allow self-insert of 'buyer' role.
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

CREATE POLICY "Users can self-assign buyer role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'buyer'::app_role);

-- Allow users to upgrade themselves to seller role (existing app feature in BecomeSellerCTA)
CREATE POLICY "Users can self-assign seller role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'seller'::app_role);

-- Fix 3: Storage - require ownership check on UPDATE for product-images
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;

CREATE POLICY "Users can update their own product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'product-images' AND owner = auth.uid());

-- Also restrict DELETE on product-images to owners (defensive)
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
CREATE POLICY "Users can delete their own product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());
