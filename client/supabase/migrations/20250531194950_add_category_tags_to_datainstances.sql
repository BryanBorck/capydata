-- Add category and tags columns to datainstances table
ALTER TABLE datainstances 
ADD COLUMN category TEXT DEFAULT 'general' CHECK (category IN ('social', 'trivia', 'science', 'code', 'trenches', 'general')),
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create indexes for better performance on category and tags
CREATE INDEX idx_datainstances_category ON datainstances(category);
CREATE INDEX idx_datainstances_tags ON datainstances USING gin(tags);

-- Update existing datainstances to have default category if null
UPDATE datainstances SET category = 'general' WHERE category IS NULL;
UPDATE datainstances SET tags = '{}' WHERE tags IS NULL;
