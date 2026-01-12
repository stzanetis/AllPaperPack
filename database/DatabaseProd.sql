-- --------------------------------
-- Enumerated Types
-- --------------------------------
CREATE TYPE public.Status AS ENUM (
    'submitted',
    'confirmed',
    'completed',
    'cancelled'
);

CREATE TYPE public.Roles AS ENUM (
    'customer',
    'admin'
);

-- --------------------------------
-- Helper function to check admin status (avoids RLS recursion)
-- --------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- --------------------------------
-- Profiles
-- --------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT,
    surname TEXT,
    telephone TEXT,
    role public.Roles NOT NULL DEFAULT 'customer',

    company_name TEXT,
    afm_number TEXT,

    city TEXT,
    street TEXT,
    zip TEXT
);

--- Row Level Security Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins manage profiles"
ON public.profiles
FOR ALL
USING (public.is_admin());

-- Trigger to create profile on new user registration
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, surname)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'name',
        NEW.raw_user_meta_data ->> 'surname'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- --------------------------------
-- Categories
-- --------------------------------
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER
        REFERENCES public.categories(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- - Row Level Security Policies for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"
ON public.categories
FOR SELECT
USING (true);

CREATE POLICY "Admins manage categories"
ON public.categories
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Product Bases
-- --------------------------------
CREATE TABLE public.product_bases (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    vat INTEGER NOT NULL DEFAULT 24,
    category_id INTEGER NOT NULL
        REFERENCES public.categories(id)
);

CREATE INDEX idx_product_bases_category ON public.product_bases(category_id);

-- Row Level Security Policies for Product Bases
ALTER TABLE public.product_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product bases"
ON public.product_bases
FOR SELECT
USING (true);

CREATE POLICY "Admins manage product bases"
ON public.product_bases
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Product Variants
-- --------------------------------
CREATE TABLE public.product_variants (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL
        REFERENCES public.product_bases(id)
        ON DELETE CASCADE,

    variant_name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    sku TEXT
);

CREATE INDEX idx_product_variants_base ON public.product_variants(base_id);

-- Row Level Security Policies for Product Variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read variants"
ON public.product_variants
FOR SELECT
USING (true);

CREATE POLICY "Admins manage variants"
ON public.product_variants
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Tags
-- --------------------------------
CREATE TABLE public.tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_hex TEXT
);

-- Row Level Security Policies for Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tags"
ON public.tags
FOR SELECT
USING (true);

CREATE POLICY "Admins manage tags"
ON public.tags
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Product_has_tags (Join Table)
-- --------------------------------
CREATE TABLE public.product_has_tags (
    base_id INTEGER NOT NULL
        REFERENCES public.product_bases(id)
        ON DELETE CASCADE,

    tag_id INTEGER NOT NULL
        REFERENCES public.tags(id)
        ON DELETE CASCADE,

    PRIMARY KEY (base_id, tag_id)
);

-- Row Level Security Policies for Product_has_tags
ALTER TABLE public.product_has_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product tags"
ON public.product_has_tags
FOR SELECT
USING (true);

CREATE POLICY "Admins manage product tags"
ON public.product_has_tags
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Cart
-- --------------------------------
CREATE TABLE public.cart (
    profile_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    variant_id INTEGER NOT NULL
        REFERENCES public.product_variants(id)
        ON DELETE CASCADE,

    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (profile_id, variant_id)
);

-- Row Level Security Policies for Cart
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart"
ON public.cart
FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- --------------------------------
-- Orders
-- --------------------------------
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    profile_id UUID NOT NULL
        REFERENCES public.profiles(id),
    
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status public.Status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_profile ON public.orders(profile_id);

-- Row Level Security Policies for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders"
ON public.orders
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users create orders"
ON public.orders
FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins manage orders"
ON public.orders
FOR ALL
USING (public.is_admin());

-- --------------------------------
-- Order_has_variants (Join Table)
-- --------------------------------
CREATE TABLE public.order_has_variants (
    order_id INTEGER NOT NULL
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    variant_id INTEGER NOT NULL
        REFERENCES public.product_variants(id),

    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    vat INTEGER NOT NULL,

    PRIMARY KEY (order_id, variant_id)
);

-- Row Level Security Policies for Order_has_variants
ALTER TABLE public.order_has_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order items"
ON public.order_has_variants
FOR SELECT
USING (
    order_id IN (
        SELECT id FROM public.orders
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Users insert own order items"
ON public.order_has_variants
FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT id FROM public.orders
        WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Admins manage order items"
ON public.order_has_variants
FOR ALL
USING (public.is_admin());

-- Trigger to recalculate order total on order items change
CREATE FUNCTION public.recalculate_order_total()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.orders
    SET total = (
        SELECT COALESCE(SUM(quantity * unit_price * (1 + vat / 100.0)), 0)
        FROM public.order_has_variants
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalc_order_total
AFTER INSERT OR UPDATE OR DELETE
ON public.order_has_variants
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_order_total();

-- --------------------------------
-- Checkout Function
-- --------------------------------
CREATE OR REPLACE FUNCTION public.checkout_order(p_order_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_insufficient_stock BOOLEAN;
BEGIN
  -- 1. Verify order ownership
  SELECT profile_id
  INTO v_profile_id
  FROM orders
  WHERE id = p_order_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_profile_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized checkout attempt';
  END IF;

  -- 2. Ensure cart is not empty
  IF NOT EXISTS (
    SELECT 1 FROM cart WHERE profile_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 3. Lock variant rows & check stock
  SELECT EXISTS (
    SELECT 1
    FROM cart c
    JOIN product_variants pv ON pv.id = c.variant_id
    WHERE c.profile_id = auth.uid()
      AND pv.stock < c.quantity
    FOR UPDATE
  )
  INTO v_insufficient_stock;

  IF v_insufficient_stock THEN
    RAISE EXCEPTION 'Insufficient stock for one or more items';
  END IF;

  -- 4. Insert order items
  INSERT INTO order_has_variants (
    order_id,
    variant_id,
    quantity,
    unit_price,
    vat
  )
  SELECT
    p_order_id,
    c.variant_id,
    c.quantity,
    pv.price,
    pb.vat
  FROM cart c
  JOIN product_variants pv ON pv.id = c.variant_id
  JOIN product_bases pb ON pb.id = pv.base_id
  WHERE c.profile_id = auth.uid();

  -- 5. Deduct stock
  UPDATE product_variants pv
  SET stock = pv.stock - c.quantity
  FROM cart c
  WHERE pv.id = c.variant_id
    AND c.profile_id = auth.uid();

  -- 6. Clear cart
  DELETE FROM cart
  WHERE profile_id = auth.uid();

END;
$$;

-- --------------------------------
-- Site Settings (key-value store for site configuration)
-- --------------------------------
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Row Level Security Policies for Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins manage site settings"
ON public.site_settings
FOR ALL
USING (public.is_admin());

-- Insert default banner text
INSERT INTO public.site_settings (key, value) VALUES 
    ('banner_text', 'We Think Green 🌱');

-- --------------------------------
-- Carousel Images (for homepage slider)
-- --------------------------------
CREATE TABLE public.carousel_images (
    id SERIAL PRIMARY KEY,
    image_path TEXT NOT NULL,
    alt_text TEXT,
    link_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Row Level Security Policies for Carousel Images
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read carousel images"
ON public.carousel_images
FOR SELECT
USING (true);

CREATE POLICY "Admins manage carousel images"
ON public.carousel_images
FOR ALL
USING (public.is_admin());
