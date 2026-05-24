-- Admins can view every profile (profiles already public-readable, but keep explicit)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all role assignments
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can assign roles to any user
CREATE POLICY "Admins can insert any role"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can change roles
CREATE POLICY "Admins can update any role"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can remove role assignments
CREATE POLICY "Admins can delete any role"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));