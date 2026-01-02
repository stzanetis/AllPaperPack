-- =====================================================
-- AllPaperPack Database - Supabase/PostgreSQL Migration
-- Converted from MySQL to PostgreSQL for Supabase
-- =====================================================

-- Enable UUID extension (commonly used in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING OBJECTS (if they exist)
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS view_products_flat CASCADE;
DROP VIEW IF EXISTS user_reviews CASCADE;
DROP VIEW IF EXISTS user_order_history CASCADE;
DROP VIEW IF EXISTS review_reminder CASCADE;
DROP VIEW IF EXISTS prod_of_cat CASCADE;
DROP VIEW IF EXISTS previous_order_details CASCADE;
DROP VIEW IF EXISTS large_orders CASCADE;
DROP VIEW IF EXISTS avg_product_score CASCADE;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS user_applied_coupons CASCADE;
DROP TABLE IF EXISTS user_places_orders CASCADE;
DROP TABLE IF EXISTS reviews_belong_to_products CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_discribed_by_tags CASCADE;
DROP TABLE IF EXISTS products_belong_to_categories CASCADE;
DROP TABLE IF EXISTS orders_shipped_to_pickup_locations CASCADE;
DROP TABLE IF EXISTS orders_include_products CASCADE;
DROP TABLE IF EXISTS coupons_applied_to_orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS pickup_locations CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- CREATE CUSTOM TYPES (ENUMs)
-- =====================================================

CREATE TYPE order_status AS ENUM (
    'Ακυρώθηκε',
    'Ολοκληρώθηκε',
    'Προς Αποστολή',
    'Καταχωρημένη'
);

CREATE TYPE user_role AS ENUM (
    'Πελάτης',
    'Διαχειριστής',
    'Υπεύθυνος Παραγγελιών'
);

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(300) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone_number VARCHAR(14),
    role user_role NOT NULL DEFAULT 'Πελάτης',
    city VARCHAR(50),
    country VARCHAR(50),
    street VARCHAR(50),
    zip VARCHAR(50),
    company_name VARCHAR(300),
    afm_number VARCHAR(9)
);

-- Categories table (self-referencing for parent categories)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    description VARCHAR(300),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    description VARCHAR(300),
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(300),
    vat INTEGER NOT NULL DEFAULT 24
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    description VARCHAR(300),
    color VARCHAR(7)
);

-- Coupons table
CREATE TABLE coupons (
    code VARCHAR(20) PRIMARY KEY,
    discount DECIMAL(10,2) NOT NULL,
    expiration_date DATE
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status order_status NOT NULL DEFAULT 'Καταχωρημένη',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Pickup locations table
CREATE TABLE pickup_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    owner_full_name VARCHAR(300) NOT NULL,
    owner_phone_number VARCHAR(14) NOT NULL,
    working_hours VARCHAR(150),
    number_of_packages INTEGER NOT NULL DEFAULT 0,
    package_capacity INTEGER NOT NULL DEFAULT 0,
    country VARCHAR(50),
    city VARCHAR(50),
    street VARCHAR(50),
    number VARCHAR(50),
    zip VARCHAR(50)
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment VARCHAR(300),
    score INTEGER NOT NULL,
    CONSTRAINT chk_score CHECK (score >= 1 AND score <= 5)
);

-- Cart (junction table)
CREATE TABLE cart (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, product_id)
);

-- Products belong to categories (junction table)
CREATE TABLE products_belong_to_categories (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Product described by tags (junction table)
CREATE TABLE product_discribed_by_tags (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- Orders include products (junction table)
CREATE TABLE orders_include_products (
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, product_id)
);

-- User places orders (junction table)
CREATE TABLE user_places_orders (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (user_id, order_id)
);

-- Coupons applied to orders (junction table)
CREATE TABLE coupons_applied_to_orders (
    coupon_code VARCHAR(20) NOT NULL REFERENCES coupons(code) ON DELETE CASCADE ON UPDATE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (coupon_code, order_id)
);

-- Orders shipped to pickup locations (junction table)
CREATE TABLE orders_shipped_to_pickup_locations (
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    pickup_id INTEGER NOT NULL REFERENCES pickup_locations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (order_id, pickup_id)
);

-- Reviews belong to products (junction table)
CREATE TABLE reviews_belong_to_products (
    review_id INTEGER PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- User applied coupons (junction table)
CREATE TABLE user_applied_coupons (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    coupon_code VARCHAR(20) NOT NULL REFERENCES coupons(code) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (user_id, coupon_code)
);

-- =====================================================
-- CREATE INDEXES (for foreign keys and performance)
-- =====================================================

CREATE INDEX idx_categories_parent          ON categories(parent_id);
CREATE INDEX idx_cart_product               ON cart(product_id);
CREATE INDEX idx_products_belong_category   ON products_belong_to_categories(category_id);
CREATE INDEX idx_product_tags               ON product_discribed_by_tags(tag_id);
CREATE INDEX idx_orders_products            ON orders_include_products(product_id);
CREATE INDEX idx_user_orders                ON user_places_orders(order_id);
CREATE INDEX idx_coupons_orders             ON coupons_applied_to_orders(order_id);
CREATE INDEX idx_orders_pickup              ON orders_shipped_to_pickup_locations(pickup_id);
CREATE INDEX idx_reviews_user               ON reviews(user_id);
CREATE INDEX idx_reviews_products           ON reviews_belong_to_products(product_id);
CREATE INDEX idx_user_coupons               ON user_applied_coupons(coupon_code);

-- =====================================================
-- INSERT DATA
-- =====================================================

-- Insert users
INSERT INTO users (id, full_name, email, phone_number, role, city, country, street, zip, company_name, afm_number) VALUES
(1, 'John Papadopoulos', 'admin@allpaperpack.gr', '+306996159627', 'Διαχειριστής', 'Thessaloniki', 'Greece', 'Egnatia 39', '58100', 'AllPaperPack', '176925483'),
(2, 'Bob Papadopoulos', 'bobpap78@mikel.gr', '+306996669969', 'Πελάτης', 'Thessaloniki', 'Greece', 'Leof. Nikis 98', '54622', 'Mikel', '185266245'),
(3, 'Dua Lipa', 'doublelips@gmail.com', '+335777777777', 'Πελάτης', 'Tirana', 'Albania', 'Koukla 67', '45542', 'AlbanianSong', '112563312'),
(4, 'Maria Georgiou', 'orders@allpaperpack.gr', '+306912345678', 'Υπεύθυνος Παραγγελιών', 'Thessaloniki', 'Greece', 'Egnatia 39', '58100', 'AllPaperPack', '176925483'),
(5, 'Nikos Kafetzis', 'coffeeshop@gmail.com', '+306944556677', 'Πελάτης', 'Athens', 'Greece', 'Ermou 15', '10563', 'Coffee Corner', '998877665');

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert coupons
INSERT INTO coupons (code, discount, expiration_date) VALUES
('asd3j40jkxd', 5.00, '2025-03-15'),
('BLACKFRIDAY25', 25.00, '2024-12-01'),
('NEWCUSTOMER', 5.00, '2025-06-30'),
('SUMMER2025', 15.00, '2025-08-31'),
('WELCOME10', 10.00, '2025-12-31');

-- Insert orders
INSERT INTO orders (id, total, status) VALUES
(1, 1152.23, 'Ολοκληρώθηκε'),
(2, 18.99, 'Ακυρώθηκε'),
(3, 52.50, 'Ολοκληρώθηκε'),
(4, 125.00, 'Προς Αποστολή'),
(5, 45.80, 'Καταχωρημένη');

-- Reset sequence for orders
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Insert pickup locations
INSERT INTO pickup_locations (id, name, owner_full_name, owner_phone_number, working_hours, number_of_packages, package_capacity, country, city, street, number, zip) VALUES
(1, 'AB Vasilopoulos Egnatia', 'John Papadopoulos', '+306996699669', '10:00-20:00', 12, 50, 'Greece', 'Thessaloniki', 'Egnatia', '39', '58100'),
(2, 'BOX NOW Nikis', 'Bob Papadopoulos', '+302382282828', '11:00-17:00 & 19:00-22:00', 0, 12, 'Greece', 'Thessaloniki', 'Leof. Nikis', '98', '54622'),
(3, 'ACS Courier Tsimiski', 'Giorgos Deliveratos', '+302310555666', '09:00-18:00', 5, 30, 'Greece', 'Thessaloniki', 'Tsimiski', '120', '54621');

-- Reset sequence for pickup_locations
SELECT setval('pickup_locations_id_seq', (SELECT MAX(id) FROM pickup_locations));

-- Insert reviews
INSERT INTO reviews (id, user_id, created_at, comment, score) VALUES
(1, 2, '2024-11-25 10:00:00', 'Almost perfect quality cups', 4),
(2, 3, '2024-11-20 13:30:00', 'Needed this for my business, great product!', 5),
(3, 5, '2024-11-28 07:45:00', 'Average quality straws', 3),
(4, 2, '2024-12-01 08:00:00', 'Excellent paper plates, very sturdy', 5),
(5, 3, '2024-11-18 12:20:00', 'Good cups for hot coffee', 4);

-- Reset sequence for reviews
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- Insert cart items
INSERT INTO cart (user_id, product_id, quantity) VALUES
(2, 1, 10),
(2, 7, 2),
(3, 8, 80),
(5, 3, 25);

-- Insert orders_include_products
INSERT INTO orders_include_products (order_id, product_id, quantity) VALUES
(1, 1, 500),
(1, 2, 300),
(1, 6, 100),
(2, 7, 10),
(3, 3, 50),
(3, 6, 20),
(4, 1, 200),
(4, 8, 100),
(4, 9, 200),
(5, 4, 100),
(5, 5, 50),
(5, 6, 30);

-- Insert user_places_orders
INSERT INTO user_places_orders (user_id, order_id) VALUES
(3, 1),
(5, 2),
(2, 3),
(5, 4),
(2, 5);

-- Insert coupons_applied_to_orders
INSERT INTO coupons_applied_to_orders (coupon_code, order_id) VALUES
('WELCOME10', 1),
('SUMMER2025', 4);

-- Insert orders_shipped_to_pickup_locations
INSERT INTO orders_shipped_to_pickup_locations (order_id, pickup_id) VALUES
(1, 1),
(3, 2);

-- Insert reviews_belong_to_products
INSERT INTO reviews_belong_to_products (review_id, product_id) VALUES
(1, 1),
(5, 1),
(4, 3),
(2, 6),
(3, 7);

-- Insert user_applied_coupons
INSERT INTO user_applied_coupons (user_id, coupon_code) VALUES
(5, 'SUMMER2025'),
(3, 'WELCOME10');

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- Average product score view
CREATE OR REPLACE VIEW avg_product_score AS
SELECT 
    rbp.product_id,
    AVG(r.score) AS avg_score
FROM reviews r
JOIN reviews_belong_to_products rbp ON r.id = rbp.review_id
GROUP BY rbp.product_id;

-- Large orders view (orders with more than 5 items)
CREATE OR REPLACE VIEW large_orders AS
SELECT 
    oip.order_id,
    SUM(oip.quantity) AS total_quantity
FROM orders_include_products oip
GROUP BY oip.order_id
HAVING SUM(oip.quantity) > 5;

-- Previous order details view
CREATE OR REPLACE VIEW previous_order_details AS
SELECT 
    o.id AS order_id,
    upo.user_id,
    p.id AS product_id,
    oip.quantity,
    p.name AS product_name
FROM orders o
JOIN user_places_orders upo ON o.id = upo.order_id
JOIN orders_include_products oip ON o.id = oip.order_id
JOIN products p ON oip.product_id = p.id;

-- Products of category view
CREATE OR REPLACE VIEW prod_of_cat AS
SELECT 
    p.name AS product_name,
    p.price,
    p.vat,
    pbc.category_id,
    p.image_url,
    c.id AS category_id_ref,
    c.name AS category_name
FROM products p
JOIN products_belong_to_categories pbc ON p.id = pbc.product_id
JOIN categories c ON pbc.category_id = c.id;

-- Review reminder view (users who haven't reviewed purchased products)
CREATE OR REPLACE VIEW review_reminder AS
SELECT DISTINCT 
    u.full_name,
    u.email
FROM users u
JOIN user_places_orders upo ON u.id = upo.user_id
JOIN orders o ON upo.order_id = o.id
JOIN orders_include_products oip ON o.id = oip.order_id
WHERE o.status = 'Ολοκληρώθηκε'
AND NOT EXISTS (
    SELECT 1 
    FROM reviews r 
    JOIN reviews_belong_to_products rbp ON r.id = rbp.review_id
    WHERE r.user_id = u.id AND rbp.product_id = oip.product_id
);

-- User order history view
CREATE OR REPLACE VIEW user_order_history AS
SELECT 
    u.id AS user_id,
    u.full_name,
    oip.quantity,
    o.id AS order_id,
    o.total,
    o.status,
    p.name AS product_name
FROM users u
JOIN user_places_orders upo ON u.id = upo.user_id
JOIN orders o ON upo.order_id = o.id
JOIN orders_include_products oip ON o.id = oip.order_id
JOIN products p ON oip.product_id = p.id;

-- User reviews view
CREATE OR REPLACE VIEW user_reviews AS
SELECT 
    r.id AS review_id,
    u.full_name AS user_name,
    rbp.product_id,
    p.name AS product_name,
    r.score,
    r.comment
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN reviews_belong_to_products rbp ON r.id = rbp.review_id
JOIN products p ON rbp.product_id = p.id;

-- Products flat view (with category hierarchy)
CREATE OR REPLACE VIEW view_products_flat AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.description,
    p.price,
    p.vat,
    p.image_url,
    p.stock,
    c.id AS category_id,
    c.name AS category_name,
    parent.id AS parent_category_id,
    COALESCE(parent.name, c.name) AS root_category_name
FROM products p
JOIN products_belong_to_categories pbc ON p.id = pbc.product_id
JOIN categories c ON pbc.category_id = c.id
LEFT JOIN categories parent ON c.parent_id = parent.id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_belong_to_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_discribed_by_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_include_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_places_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons_applied_to_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_shipped_to_pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_belong_to_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applied_coupons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC READ ACCESS POLICIES
-- =====================================================

-- Allow public read access to products
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

-- Allow public read access to categories
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Allow public read access to tags
CREATE POLICY "Tags are viewable by everyone" ON tags
    FOR SELECT USING (true);

-- Allow public read access to product-tag relationships
CREATE POLICY "Product tags are viewable by everyone" ON product_discribed_by_tags
    FOR SELECT USING (true);

-- Allow public read access to product-category relationships
CREATE POLICY "Product categories are viewable by everyone" ON products_belong_to_categories
    FOR SELECT USING (true);

-- Allow public read access to reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

-- Allow public read access to review-product relationships
CREATE POLICY "Review products are viewable by everyone" ON reviews_belong_to_products
    FOR SELECT USING (true);

-- Allow public read access to pickup locations
CREATE POLICY "Pickup locations are viewable by everyone" ON pickup_locations
    FOR SELECT USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Helper function to get current user's role from users table
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS user_role AS $$
    SELECT role FROM users WHERE email = user_email;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user's ID from users table
CREATE OR REPLACE FUNCTION get_user_id(user_email TEXT)
RETURNS INTEGER AS $$
    SELECT id FROM users WHERE email = user_email;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Secure coupon validation function
CREATE OR REPLACE FUNCTION validate_coupon_for_user(
    coupon_code_param TEXT,
    user_email_param TEXT
)
RETURNS TABLE (
    discount DECIMAL(10,2),
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    coupon_record RECORD;
    user_id_val INTEGER;
    user_role_val user_role;
BEGIN
    -- Get user info
    SELECT id, role INTO user_id_val, user_role_val
    FROM users WHERE email = user_email_param;

    -- Check if user exists and is a customer
    IF user_id_val IS NULL THEN
        RETURN QUERY SELECT NULL::DECIMAL(10,2), FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;

    IF user_role_val != 'Πελάτης' THEN
        RETURN QUERY SELECT NULL::DECIMAL(10,2), FALSE, 'Only customers can validate coupons'::TEXT;
        RETURN;
    END IF;

    -- Get coupon
    SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code_param;

    IF coupon_record IS NULL THEN
        RETURN QUERY SELECT NULL::DECIMAL(10,2), FALSE, 'Invalid coupon code'::TEXT;
        RETURN;
    END IF;

    -- Check expiration
    IF coupon_record.expiration_date IS NOT NULL AND coupon_record.expiration_date < CURRENT_DATE THEN
        RETURN QUERY SELECT NULL::DECIMAL(10,2), FALSE, 'Coupon has expired'::TEXT;
        RETURN;
    END IF;

    -- Check if user already used this coupon
    IF EXISTS (
        SELECT 1 FROM user_applied_coupons
        WHERE user_id = user_id_val AND coupon_code = coupon_code_param
    ) THEN
        RETURN QUERY SELECT NULL::DECIMAL(10,2), FALSE, 'Coupon already used'::TEXT;
        RETURN;
    END IF;

    -- Valid coupon
    RETURN QUERY SELECT coupon_record.discount, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADMIN POLICIES (Διαχειριστής)
-- =====================================================

-- Products management
CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Categories management
CREATE POLICY "Admins can insert categories" ON categories
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Tags management
CREATE POLICY "Admins can insert tags" ON tags
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update tags" ON tags
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete tags" ON tags
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Coupons management
CREATE POLICY "Admins can insert coupons" ON coupons
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update coupons" ON coupons
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete coupons" ON coupons
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Users management
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Product-category relationships
CREATE POLICY "Admins can insert product categories" ON products_belong_to_categories
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete product categories" ON products_belong_to_categories
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Product-tag relationships
CREATE POLICY "Admins can insert product tags" ON product_discribed_by_tags
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete product tags" ON product_discribed_by_tags
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Orders management
CREATE POLICY "Admins can view orders" ON orders
    FOR SELECT USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete orders" ON orders
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- Pickup locations management
CREATE POLICY "Admins can insert pickup locations" ON pickup_locations
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can update pickup locations" ON pickup_locations
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

CREATE POLICY "Admins can delete pickup locations" ON pickup_locations
    FOR DELETE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Διαχειριστής'
    );

-- =====================================================
-- CUSTOMER POLICIES (Πελάτης)
-- =====================================================

-- Cart management
CREATE POLICY "Customers can insert cart items" ON cart
    FOR INSERT WITH CHECK (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can update cart items" ON cart
    FOR UPDATE USING (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can delete cart items" ON cart
    FOR DELETE USING (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can view their own cart" ON cart
    FOR SELECT USING (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

-- Orders management
CREATE POLICY "Customers can create orders" ON orders
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Πελάτης'
    );

CREATE POLICY "Customers can view their own orders" ON orders
    FOR SELECT USING (
        id IN (
            SELECT order_id FROM user_places_orders
            WHERE user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

-- Order relationships
CREATE POLICY "Customers can link orders to themselves" ON user_places_orders
    FOR INSERT WITH CHECK (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can view their own order relationships" ON user_places_orders
    FOR SELECT USING (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

-- Order products
CREATE POLICY "Customers can add products to orders" ON orders_include_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_places_orders upo
            WHERE upo.order_id = orders_include_products.order_id
            AND upo.user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

CREATE POLICY "Customers can view products in their own orders" ON orders_include_products
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM user_places_orders
            WHERE user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

-- Coupons
CREATE POLICY "Customers can apply coupons to orders" ON coupons_applied_to_orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_places_orders upo
            WHERE upo.order_id = coupons_applied_to_orders.order_id
            AND upo.user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

CREATE POLICY "Customers can view coupons applied to their own orders" ON coupons_applied_to_orders
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM user_places_orders
            WHERE user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

CREATE POLICY "Customers can track used coupons" ON user_applied_coupons
    FOR INSERT WITH CHECK (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can view their applied coupons" ON user_applied_coupons
    FOR SELECT USING (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

-- Pickup locations for orders
CREATE POLICY "Customers can choose pickup locations" ON orders_shipped_to_pickup_locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_places_orders upo
            WHERE upo.order_id = orders_shipped_to_pickup_locations.order_id
            AND upo.user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

CREATE POLICY "Customers can view pickup locations for their own orders" ON orders_shipped_to_pickup_locations
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM user_places_orders
            WHERE user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

-- Reviews
CREATE POLICY "Customers can write reviews" ON reviews
    FOR INSERT WITH CHECK (
        user_id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can link reviews to products" ON reviews_belong_to_products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = reviews_belong_to_products.review_id
            AND r.user_id = get_user_id((select auth.jwt()->>'email'))
        )
    );

-- User profile
CREATE POLICY "Customers can view their own profile" ON users
    FOR SELECT USING (
        id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can update their own profile" ON users
    FOR UPDATE USING (
        id = get_user_id((select auth.jwt()->>'email'))
    );

CREATE POLICY "Customers can create their own user record" ON users
    FOR INSERT WITH CHECK (
        email = (select auth.jwt()->>'email') AND
        role = 'Πελάτης'
    );

-- =====================================================
-- ORDER MANAGER POLICIES (Υπεύθυνος Παραγγελιών)
-- =====================================================

-- Orders management
CREATE POLICY "Order managers can view orders" ON orders
    FOR SELECT USING (
        get_user_role((select auth.jwt()->>'email')) = 'Υπεύθυνος Παραγγελιών'
    );

CREATE POLICY "Order managers can update orders" ON orders
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Υπεύθυνος Παραγγελιών'
    );

-- Pickup locations management
CREATE POLICY "Order managers can insert pickup locations" ON pickup_locations
    FOR INSERT WITH CHECK (
        get_user_role((select auth.jwt()->>'email')) = 'Υπεύθυνος Παραγγελιών'
    );

CREATE POLICY "Order managers can update pickup locations" ON pickup_locations
    FOR UPDATE USING (
        get_user_role((select auth.jwt()->>'email')) = 'Υπεύθυνος Παραγγελιών'
    );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on all tables to anon (public read)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant all operations on tables to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Restrict SELECT on sensitive views from anon (public)
REVOKE SELECT ON user_order_history FROM anon;
REVOKE SELECT ON previous_order_details FROM anon;
REVOKE SELECT ON review_reminder FROM anon;
REVOKE SELECT ON large_orders FROM anon;

-- =====================================================
-- TRIGGERS FOR AUTH.USER EVENTS
-- =====================================================

-- Create a function that will be triggered on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (full_name, email, role)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'Πελάτης'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function that will be triggered on user update
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        email = NEW.email
    WHERE email = OLD.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that fires after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a trigger that fires after a user is updated in auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

-- =====================================================
-- CHECKOUT FUNCTIONS (SECURITY DEFINER - Bypass RLS)
-- =====================================================
-- These functions handle the checkout process and bypass
-- RLS by running as the database owner (SECURITY DEFINER).
-- This solves the circular dependency issues with RLS policies.
-- =====================================================

-- Function to create an order and link it to a user
CREATE OR REPLACE FUNCTION create_order_for_user(
    p_user_email TEXT,
    p_total DECIMAL(10,2),
    p_status TEXT DEFAULT 'Καταχωρημένη'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id INTEGER;
    v_order_id INTEGER;
BEGIN
    -- Get user id from email
    SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_email;
    END IF;
    
    -- Create the order
    INSERT INTO orders (total, status)
    VALUES (p_total, p_status::order_status)
    RETURNING id INTO v_order_id;
    
    -- Link user to order
    INSERT INTO user_places_orders (user_id, order_id)
    VALUES (v_user_id, v_order_id);
    
    RETURN v_order_id;
END;
$$;

-- Function to add products to an order
CREATE OR REPLACE FUNCTION add_products_to_order(
    p_order_id INTEGER,
    p_products JSONB -- Array of {product_id, quantity}
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product JSONB;
    v_product_id INTEGER;
    v_quantity INTEGER;
    v_current_stock INTEGER;
BEGIN
    FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
    LOOP
        v_product_id := (v_product->>'product_id')::INTEGER;
        v_quantity := (v_product->>'quantity')::INTEGER;
        
        -- Add to order
        INSERT INTO orders_include_products (order_id, product_id, quantity)
        VALUES (p_order_id, v_product_id, v_quantity);
        
        -- Update stock
        SELECT stock INTO v_current_stock FROM products WHERE id = v_product_id;
        UPDATE products 
        SET stock = GREATEST(0, v_current_stock - v_quantity)
        WHERE id = v_product_id;
    END LOOP;
END;
$$;

-- Function to apply coupon to order
CREATE OR REPLACE FUNCTION apply_coupon_to_order(
    p_user_email TEXT,
    p_order_id INTEGER,
    p_coupon_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_email;
    END IF;
    
    -- Link coupon to order
    INSERT INTO coupons_applied_to_orders (coupon_code, order_id)
    VALUES (p_coupon_code, p_order_id);
    
    -- Mark coupon as used by user
    INSERT INTO user_applied_coupons (user_id, coupon_code)
    VALUES (v_user_id, p_coupon_code);
END;
$$;

-- Function to set pickup location for order
CREATE OR REPLACE FUNCTION set_order_pickup_location(
    p_order_id INTEGER,
    p_pickup_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Link order to pickup location
    INSERT INTO orders_shipped_to_pickup_locations (order_id, pickup_id)
    VALUES (p_order_id, p_pickup_id);
    
    -- Increment package count
    UPDATE pickup_locations
    SET number_of_packages = number_of_packages + 1
    WHERE id = p_pickup_id;
END;
$$;

-- Function to clear user's cart
CREATE OR REPLACE FUNCTION clear_user_cart(p_user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE email = p_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_user_email;
    END IF;
    
    DELETE FROM cart WHERE user_id = v_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_order_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION add_products_to_order TO authenticated;
GRANT EXECUTE ON FUNCTION apply_coupon_to_order TO authenticated;
GRANT EXECUTE ON FUNCTION set_order_pickup_location TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_cart TO authenticated;

-- Grant to anon for edge cases (can be removed if not needed)
GRANT EXECUTE ON FUNCTION create_order_for_user TO anon;
GRANT EXECUTE ON FUNCTION add_products_to_order TO anon;
GRANT EXECUTE ON FUNCTION apply_coupon_to_order TO anon;
GRANT EXECUTE ON FUNCTION set_order_pickup_location TO anon;
GRANT EXECUTE ON FUNCTION clear_user_cart TO anon;