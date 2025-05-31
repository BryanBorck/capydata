-- Add points to profiles table
ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0 CHECK (points >= 0);

-- Add variant and background to pets table
ALTER TABLE pets ADD COLUMN variant TEXT DEFAULT 'default' CHECK (variant IN ('default', 'pink', 'blue', 'ice', 'black'));
ALTER TABLE pets ADD COLUMN background TEXT DEFAULT 'farm' CHECK (background IN ('farm', 'ice', 'beach', 'forest', 'lake'));

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL CHECK (price >= 0),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pet_items junction table (many-to-many relationship)
CREATE TABLE pet_items (
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    equipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (pet_id, item_id)
);

-- Add RLS policies for items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users can read all items (for shop/catalog)
CREATE POLICY "Users can read all items" ON items FOR SELECT USING (true);

-- Only authenticated users can manage items (for admin purposes)
CREATE POLICY "Only authenticated users can manage items" ON items 
FOR ALL USING (auth.uid() IS NOT NULL);

-- Add RLS policies for pet_items table
ALTER TABLE pet_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pet items
CREATE POLICY "Users can see their own pet items" ON pet_items 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM pets 
        WHERE pets.id = pet_items.pet_id 
        AND pets.owner_wallet = auth.jwt() ->> 'wallet_address'
    )
);

-- Users can only manage their own pet items
CREATE POLICY "Users can manage their own pet items" ON pet_items 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM pets 
        WHERE pets.id = pet_items.pet_id 
        AND pets.owner_wallet = auth.jwt() ->> 'wallet_address'
    )
);

-- Add some default items
INSERT INTO items (name, price, rarity) VALUES
('hat_basic', 100, 'common'),
('hat_wizard', 500, 'rare'),
('hat_crown', 2000, 'legendary'),
('glasses_basic', 150, 'common'),
('glasses_cool', 300, 'rare'),
('necklace_gold', 800, 'epic'),
('bow_pink', 200, 'common'),
('bow_rainbow', 1000, 'epic');

-- Add indexes for better performance
CREATE INDEX idx_pets_variant ON pets(variant);
CREATE INDEX idx_pets_background ON pets(background);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_pet_items_pet_id ON pet_items(pet_id);
CREATE INDEX idx_pet_items_item_id ON pet_items(item_id);

-- Update existing pets to have default variant and background if null
UPDATE pets SET variant = 'default' WHERE variant IS NULL;
UPDATE pets SET background = 'farm' WHERE background IS NULL; 