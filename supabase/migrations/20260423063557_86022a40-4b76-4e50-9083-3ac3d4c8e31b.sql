-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all products (for approval)
CREATE POLICY "Admins can update all products"
ON public.products
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all services
CREATE POLICY "Admins can view all services"
ON public.service_listings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all services (for approval)
CREATE POLICY "Admins can update all services"
ON public.service_listings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));