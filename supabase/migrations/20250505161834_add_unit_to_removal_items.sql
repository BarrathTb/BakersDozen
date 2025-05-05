-- Add the unit column to the removal_items table
ALTER TABLE public.removal_items
ADD COLUMN unit TEXT;

-- Optional: Add a NOT NULL constraint if a unit is always required
-- ALTER TABLE removal_items
-- ALTER COLUMN unit SET NOT NULL;

-- Optional: Add a default value if needed
ALTER TABLE public.removal_items
ALTER COLUMN unit SET DEFAULT 'kg';