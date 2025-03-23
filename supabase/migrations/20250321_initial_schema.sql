-- Bakers Dozen - Initial Schema
-- This file creates the database schema and inserts initial data for the Bakers Dozen application

-- Create tables

-- Create users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

-- Create ingredients table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ingredients')
BEGIN
    CREATE TABLE ingredients (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit NVARCHAR(50) NOT NULL,
        last_updated DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

-- Create recipes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'recipes')
BEGIN
    CREATE TABLE recipes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        expected_yield INT NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- Create recipe_ingredients table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'recipe_ingredients')
BEGIN
    CREATE TABLE recipe_ingredients (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        recipe_id UNIQUEIDENTIFIER NOT NULL,
        ingredient_id UNIQUEIDENTIFIER NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
        CONSTRAINT UQ_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
    );
END;

-- Create bakes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bakes')
BEGIN
    CREATE TABLE bakes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        recipe_id UNIQUEIDENTIFIER NOT NULL,
        actual_yield INT NOT NULL,
        bake_date DATETIME2 NOT NULL,
        notes NVARCHAR(MAX),
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- Create deliveries table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'deliveries')
BEGIN
    CREATE TABLE deliveries (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        supplier NVARCHAR(255) NOT NULL,
        delivery_date DATETIME2 NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- Create delivery_items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'delivery_items')
BEGIN
    CREATE TABLE delivery_items (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        delivery_id UNIQUEIDENTIFIER NOT NULL,
        ingredient_id UNIQUEIDENTIFIER NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        batch_number NVARCHAR(100) NOT NULL,
        expiry_date DATETIME2 NOT NULL,
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );
END;

-- Create removals table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'removals')
BEGIN
    CREATE TABLE removals (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        reason NVARCHAR(50) NOT NULL CHECK (reason IN ('waste', 'sale', 'transfer')),
        removal_date DATETIME2 NOT NULL,
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );
END;

-- Create removal_items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'removal_items')
BEGIN
    CREATE TABLE removal_items (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        removal_id UNIQUEIDENTIFIER NOT NULL,
        ingredient_id UNIQUEIDENTIFIER NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (removal_id) REFERENCES removals(id) ON DELETE CASCADE,
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );
END;

-- Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_recipe_ingredients_recipe_id')
    CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_recipe_ingredients_ingredient_id')
    CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bakes_recipe_id')
    CREATE INDEX idx_bakes_recipe_id ON bakes(recipe_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_delivery_items_delivery_id')
    CREATE INDEX idx_delivery_items_delivery_id ON delivery_items(delivery_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_delivery_items_ingredient_id')
    CREATE INDEX idx_delivery_items_ingredient_id ON delivery_items(ingredient_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_removal_items_removal_id')
    CREATE INDEX idx_removal_items_removal_id ON removal_items(removal_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_removal_items_ingredient_id')
    CREATE INDEX idx_removal_items_ingredient_id ON removal_items(ingredient_id);

-- Insert initial data if tables are empty

-- Insert users
IF NOT EXISTS (SELECT * FROM users)
BEGIN
    INSERT INTO users (id, email, role, created_at) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', GETDATE()),
    ('00000000-0000-0000-0000-000000000002', 'user@example.com', 'user', GETDATE());
END;

-- Insert ingredients
IF NOT EXISTS (SELECT * FROM ingredients)
BEGIN
    INSERT INTO ingredients (id, name, current_quantity, min_quantity, unit, last_updated) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Flour', 25, 10, 'kg', GETDATE()),
    ('00000000-0000-0000-0000-000000000002', 'Sugar', 15, 5, 'kg', GETDATE()),
    ('00000000-0000-0000-0000-000000000003', 'Butter', 8, 4, 'kg', GETDATE()),
    ('00000000-0000-0000-0000-000000000004', 'Eggs', 60, 24, 'pcs', GETDATE()),
    ('00000000-0000-0000-0000-000000000005', 'Milk', 12, 6, 'L', GETDATE()),
    ('00000000-0000-0000-0000-000000000006', 'Yeast', 2, 1, 'kg', GETDATE()),
    ('00000000-0000-0000-0000-000000000007', 'Salt', 3, 1, 'kg', GETDATE()),
    ('00000000-0000-0000-0000-000000000008', 'Chocolate Chips', 5, 2, 'kg', GETDATE());
END;

-- Insert recipes
IF NOT EXISTS (SELECT * FROM recipes)
BEGIN
    INSERT INTO recipes (id, name, expected_yield, created_by, created_at) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Sourdough Bread', 10, '00000000-0000-0000-0000-000000000001', GETDATE()),
    ('00000000-0000-0000-0000-000000000002', 'Chocolate Chip Cookies', 24, '00000000-0000-0000-0000-000000000001', GETDATE()),
    ('00000000-0000-0000-0000-000000000003', 'Croissants', 12, '00000000-0000-0000-0000-000000000001', GETDATE());
END;

-- Insert recipe ingredients
IF NOT EXISTS (SELECT * FROM recipe_ingredients)
BEGIN
    INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity) VALUES 
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
END;

-- Insert bakes (using relative dates)
IF NOT EXISTS (SELECT * FROM bakes)
BEGIN
    INSERT INTO bakes (id, recipe_id, actual_yield, bake_date, created_by, created_at) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 9, DATEADD(day, -7, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -7, GETDATE())),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 22, DATEADD(day, -3, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -3, GETDATE()));
END;

-- Insert deliveries
IF NOT EXISTS (SELECT * FROM deliveries)
BEGIN
    INSERT INTO deliveries (id, supplier, delivery_date, created_by, created_at) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Flour Supplier Inc.', DATEADD(day, -14, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -14, GETDATE())),
    ('00000000-0000-0000-0000-000000000002', 'Dairy Products Co.', DATEADD(day, -10, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -10, GETDATE()));
END;

-- Insert delivery items
IF NOT EXISTS (SELECT * FROM delivery_items)
BEGIN
    INSERT INTO delivery_items (id, delivery_id, ingredient_id, quantity, batch_number, expiry_date) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 25, 'FL-2025-001', DATEADD(day, 180, GETDATE())),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 15, 'SG-2025-001', DATEADD(day, 365, GETDATE())),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 10, 'BT-2025-001', DATEADD(day, 90, GETDATE())),
    ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 15, 'ML-2025-001', DATEADD(day, 14, GETDATE()));
END;

-- Insert removals
IF NOT EXISTS (SELECT * FROM removals)
BEGIN
    INSERT INTO removals (id, reason, removal_date, created_by, created_at) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'waste', DATEADD(day, -5, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -5, GETDATE())),
    ('00000000-0000-0000-0000-000000000002', 'sale', DATEADD(day, -2, GETDATE()), '00000000-0000-0000-0000-000000000001', DATEADD(day, -2, GETDATE()));
END;

-- Insert removal items
IF NOT EXISTS (SELECT * FROM removal_items)
BEGIN
    INSERT INTO removal_items (id, removal_id, ingredient_id, quantity) VALUES 
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 2),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5);
END;

-- Create views for reporting

-- Inventory status view
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'inventory_status')
BEGIN
    EXEC('
    CREATE VIEW inventory_status AS
    SELECT 
        i.id,
        i.name,
        i.current_quantity,
        i.min_quantity,
        i.unit,
        i.last_updated,
        CASE 
            WHEN i.current_quantity <= 0 THEN ''Out of Stock''
            WHEN i.current_quantity <= i.min_quantity THEN ''Low Stock''
            ELSE ''In Stock''
        END AS status
    FROM 
        ingredients i
    ');
END;

-- Recipe details view
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'recipe_details')
BEGIN
    EXEC('
    CREATE VIEW recipe_details AS
    SELECT 
        r.id,
        r.name,
        r.expected_yield,
        u.email as created_by_email,
        r.created_at,
        COUNT(ri.id) as ingredient_count
    FROM 
        recipes r
    JOIN 
        users u ON r.created_by = u.id
    LEFT JOIN 
        recipe_ingredients ri ON r.id = ri.recipe_id
    GROUP BY 
        r.id, r.name, r.expected_yield, u.email, r.created_at
    ');
END;

-- Bake efficiency view
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'bake_efficiency')
BEGIN
    EXEC('
    CREATE VIEW bake_efficiency AS
    SELECT 
        b.id,
        b.bake_date,
        r.name as recipe_name,
        b.actual_yield,
        r.expected_yield,
        (CAST(b.actual_yield AS FLOAT) / CAST(r.expected_yield AS FLOAT)) * 100 as efficiency,
        u.email as baker_email,
        b.notes
    FROM 
        bakes b
    JOIN 
        recipes r ON b.recipe_id = r.id
    JOIN 
        users u ON b.created_by = u.id
    ');
END;

-- Create triggers for inventory management

-- Trigger to update ingredient quantity after a delivery
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_ingredient_after_delivery')
BEGIN
    EXEC('
    CREATE TRIGGER trg_update_ingredient_after_delivery
    ON delivery_items
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE i
        SET 
            current_quantity = i.current_quantity + ins.quantity,
            last_updated = GETDATE()
        FROM 
            ingredients i
        INNER JOIN 
            inserted ins ON i.id = ins.ingredient_id;
    END
    ');
END;

-- Trigger to update ingredient quantity after a removal
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_ingredient_after_removal')
BEGIN
    EXEC('
    CREATE TRIGGER trg_update_ingredient_after_removal
    ON removal_items
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE i
        SET 
            current_quantity = i.current_quantity - ins.quantity,
            last_updated = GETDATE()
        FROM 
            ingredients i
        INNER JOIN 
            inserted ins ON i.id = ins.ingredient_id;
    END
    ');
END;

-- Trigger to update ingredient quantities after a bake
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_update_ingredients_after_bake')
BEGIN
    EXEC('
    CREATE TRIGGER trg_update_ingredients_after_bake
    ON bakes
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        UPDATE i
        SET 
            current_quantity = i.current_quantity - (ri.quantity * b.actual_yield / r.expected_yield),
            last_updated = GETDATE()
        FROM 
            ingredients i
        INNER JOIN 
            recipe_ingredients ri ON i.id = ri.ingredient_id
        INNER JOIN 
            inserted b ON ri.recipe_id = b.recipe_id
        INNER JOIN
            recipes r ON b.recipe_id = r.id;
    END
    ');
END;