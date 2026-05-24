DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

CREATE POLICY "Product images can be viewed by path"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images' AND name IS NOT NULL);