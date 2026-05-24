ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'product',
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS units_sold INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_products_seller_status ON public.products (seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_listing_type ON public.products (listing_type);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Approved products are viewable by everyone"
ON public.products
FOR SELECT
USING (is_active = true AND approval_status = 'approved');

CREATE TABLE IF NOT EXISTS public.service_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC,
  location TEXT,
  phone TEXT,
  whatsapp TEXT,
  image_url TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved services are viewable by everyone"
ON public.service_listings
FOR SELECT
USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Sellers can view their own services"
ON public.service_listings
FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create their own services"
ON public.service_listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own services"
ON public.service_listings
FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own services"
ON public.service_listings
FOR DELETE
USING (auth.uid() = seller_id);

CREATE TRIGGER update_service_listings_updated_at
BEFORE UPDATE ON public.service_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();