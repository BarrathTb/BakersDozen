-- Bakers Dozen - Initial Schema for PostgreSQL/Supabase
-- This file creates the database schema and inserts initial data for the Bakers Dozen application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.removal_items;
DROP TABLE IF EXISTS public.removals;
DROP TABLE IF EXISTS public.delivery_items;
DROP TABLE IF EXISTS public.deliveries;
DROP TABLE IF EXISTS public.bakes;
DROP TABLE IF EXISTS public.recipe_ingredients;
DROP TABLE IF EXISTS public.recipes;
DROP TABLE IF EXISTS public.ingredients;
DROP TABLE IF EXISTS public.users;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Users of the application';

-- Create ingredients table
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ingredients IS 'Inventory ingredients';

-- Create recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    expected_yield INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.recipes IS 'Baking recipes';

-- Create recipe_ingredients table
CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL,
    UNIQUE (recipe_id, ingredient_id)
);

COMMENT ON TABLE public.recipe_ingredients IS 'Ingredients required for each recipe';

-- Create bakes table
CREATE TABLE public.bakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id),
    actual_yield INTEGER NOT NULL,
    bake_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bakes IS 'Record of baking events';

-- Create deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier TEXT NOT NULL,
    delivery_date TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.deliveries IS 'Ingredient deliveries from suppliers';

-- Create delivery_items table
CREATE TABLE public.delivery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
    quantity DECIMAL(10, 2) NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE public.delivery_items IS 'Items included in each delivery';

-- Create removals table
CREATE TABLE public.removals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reason TEXT NOT NULL CHECK (reason IN ('waste', 'sale', 'transfer')),
    removal_date TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.removals IS 'Record of ingredient removals';

-- Create removal_items table
CREATE TABLE public.removal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    removal_id UUID NOT NULL REFERENCES public.removals(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
    quantity DECIMAL(10, 2) NOT NULL
);

COMMENT ON TABLE public.removal_items IS 'Items included in each removal';

-- Create indexes for performance
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);
CREATE INDEX idx_bakes_recipe_id ON public.bakes(recipe_id);
CREATE INDEX idx_delivery_items_delivery_id ON public.delivery_items(delivery_id);
CREATE INDEX idx_delivery_items_ingredient_id ON public.delivery_items(ingredient_id);
CREATE INDEX idx_removal_items_removal_id ON public.removal_items(removal_id);
CREATE INDEX idx_removal_items_ingredient_id ON public.removal_items(ingredient_id);

-- Insert initial data

-- Insert users
INSERT INTO public.users (id, email, role, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', NOW()),
('00000000-0000-0000-0000-000000000002', 'user@example.com', 'user', NOW());

-- Insert ingredients
INSERT INTO public.ingredients (id, name, current_quantity, min_quantity, unit, last_updated) VALUES 
('00000000-0000-0000-0000-000000000001', 'Flour', 25, 10, 'kg', NOW()),
('00000000-0000-0000-0000-000000000002', 'Sugar', 15, 5, 'kg', NOW()),
('00000000-0000-0000-0000-000000000003', 'Butter', 8, 4, 'kg', NOW()),
('00000000-0000-0000-0000-000000000004', 'Eggs', 60, 24, 'pcs', NOW()),
('00000000-0000-0000-0000-000000000005', 'Milk', 12, 6, 'L', NOW()),
('00000000-0000-0000-0000-000000000006', 'Yeast', 2, 1, 'kg', NOW()),
('00000000-0000-0000-0000-000000000007', 'Salt', 3, 1, 'kg', NOW()),
('00000000-0000-0000-0000-000000000008', 'Chocolate Chips', 5, 2, 'kg', NOW());

-- Insert recipes
INSERT INTO public.recipes (id, name, expected_yield, created_by, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'Sourdough Bread', 10, '00000000-0000-0000-0000-000000000001', NOW()),
('00000000-0000-0000-0000-000000000002', 'Chocolate Chip Cookies', 24, '00000000-0000-0000-0000-000000000001', NOW()),
('00000000-0000-0000-0000-000000000003', 'Croissants', 12, '00000000-0000-0000-0000-000000000001', NOW());

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 0.1),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 0.1),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 0.5),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 1.5),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 1),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 4),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', 1),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 2),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 0.5);

-- Insert bakes (using relative dates)
INSERT INTO public.bakes (id, recipe_id, actual_yield, bake_date, created_by, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 9, NOW() - INTERVAL '7 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 22, NOW() - INTERVAL '3 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days');

-- Insert deliveries
INSERT INTO public.deliveries (id, supplier, delivery_date, created_by, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'Flour Supplier Inc.', NOW() - INTERVAL '14 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000002', 'Dairy Products Co.', NOW() - INTERVAL '10 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days');

-- Insert delivery items
INSERT INTO public.delivery_items (id, delivery_id, ingredient_id, quantity, batch_number, expiry_date) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 25, 'FL-2025-001', NOW() + INTERVAL '180 days'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 15, 'SG-2025-001', NOW() + INTERVAL '365 days'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 10, 'BT-2025-001', NOW() + INTERVAL '90 days'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 15, 'ML-2025-001', NOW() + INTERVAL '14 days');

-- Insert removals
INSERT INTO public.removals (id, reason, removal_date, created_by, created_at) VALUES 
('00000000-0000-0000-0000-000000000001', 'waste', NOW() - INTERVAL '5 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000002', 'sale', NOW() - INTERVAL '2 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days');

-- Insert removal items
INSERT INTO public.removal_items (id, removal_id, ingredient_id, quantity) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 2),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5);

-- Create views for reporting

-- Inventory status view
CREATE OR REPLACE VIEW public.inventory_status AS
SELECT 
    i.id,
    i.name,
    i.current_quantity,
    i.min_quantity,
    i.unit,
    i.last_updated,
    CASE 
        WHEN i.current_quantity <= 0 THEN 'Out of Stock'
        WHEN i.current_quantity <= i.min_quantity THEN 'Low Stock'
        ELSE 'In Stock'
    END AS status
FROM 
    public.ingredients i;

-- Recipe details view
CREATE OR REPLACE VIEW public.recipe_details AS
SELECT 
    r.id,
    r.name,
    r.expected_yield,
    u.email as created_by_email,
    r.created_at,
    COUNT(ri.id) as ingredient_count
FROM 
    public.recipes r
JOIN 
    public.users u ON r.created_by = u.id
LEFT JOIN 
    public.recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY 
    r.id, r.name, r.expected_yield, u.email, r.created_at;

-- Bake efficiency view
CREATE OR REPLACE VIEW public.bake_efficiency AS
SELECT 
    b.id,
    b.bake_date,
    r.name as recipe_name,
    b.actual_yield,
    r.expected_yield,
    (b.actual_yield::float / r.expected_yield::float) * 100 as efficiency,
    u.email as baker_email,
    b.notes
FROM 
    public.bakes b
JOIN 
    public.recipes r ON b.recipe_id = r.id
JOIN 
    public.users u ON b.created_by = u.id;

-- Create functions for inventory management

-- Function to update ingredient quantity after a delivery
CREATE OR REPLACE FUNCTION public.update_ingredient_after_delivery()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.ingredients
    SET 
        current_quantity = current_quantity + NEW.quantity,
        last_updated = NOW()
    WHERE id = NEW.ingredient_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ingredient quantity after a removal
CREATE OR REPLACE FUNCTION public.update_ingredient_after_removal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.ingredients
    SET 
        current_quantity = current_quantity - NEW.quantity,
        last_updated = NOW()
    WHERE id = NEW.ingredient_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ingredient quantities after a bake
CREATE OR REPLACE FUNCTION public.update_ingredients_after_bake()
RETURNS TRIGGER AS $$
DECLARE
    recipe_ingredient RECORD;
BEGIN
    FOR recipe_ingredient IN (
        SELECT ri.ingredient_id, ri.quantity
        FROM public.recipe_ingredients ri
        WHERE ri.recipe_id = NEW.recipe_id
    ) LOOP
        UPDATE public.ingredients
        SET 
            current_quantity = current_quantity - (recipe_ingredient.quantity * NEW.actual_yield / 
                               (SELECT expected_yield FROM public.recipes WHERE id = NEW.recipe_id)),
            last_updated = NOW()
        WHERE id = recipe_ingredient.ingredient_id;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Trigger for delivery items
CREATE TRIGGER update_ingredient_after_delivery_trigger
AFTER INSERT ON public.delivery_items
FOR EACH ROW
EXECUTE FUNCTION public.update_ingredient_after_delivery();

-- Trigger for removal items
CREATE TRIGGER update_ingredient_after_removal_trigger
AFTER INSERT ON public.removal_items
FOR EACH ROW
EXECUTE FUNCTION public.update_ingredient_after_removal();

-- Trigger for bakes
CREATE TRIGGER update_ingredients_after_bake_trigger
AFTER INSERT ON public.bakes
FOR EACH ROW
EXECUTE FUNCTION public.update_ingredients_after_bake();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.removals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.removal_items ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all data
CREATE POLICY "Users can view all data" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.bakes FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.delivery_items FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.removals FOR SELECT USING (true);
CREATE POLICY "Users can view all data" ON public.removal_items FOR SELECT USING (true);

-- Users can insert data
CREATE POLICY "Users can insert data" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.recipe_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.bakes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.delivery_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.removals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert data" ON public.removal_items FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can update data" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Users can update their own data" ON public.recipes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can update data" ON public.recipe_ingredients FOR UPDATE USING (true);
CREATE POLICY "Users can update their own data" ON public.bakes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can update their own data" ON public.deliveries FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can update data" ON public.delivery_items FOR UPDATE USING (true);
CREATE POLICY "Users can update their own data" ON public.removals FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can update data" ON public.removal_items FOR UPDATE USING (true);

-- Only admins can delete data
CREATE POLICY "Admins can delete data" ON public.ingredients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.recipes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.recipe_ingredients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.bakes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.deliveries FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.delivery_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.removals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete data" ON public.removal_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);