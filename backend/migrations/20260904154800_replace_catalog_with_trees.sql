DELETE FROM user_world_items
WHERE world_item_id IN (
    SELECT id FROM world_items WHERE name IN ('Small House', 'Flower Bed', 'Stone Road')
);

DELETE FROM world_items
WHERE name IN ('Small House', 'Flower Bed', 'Stone Road');

INSERT INTO world_items (name, description, price, category)
SELECT 'Cherry Blossom', 'A pink cherry blossom tree.', 30, 'tree'
WHERE NOT EXISTS (
    SELECT 1 FROM world_items WHERE name = 'Cherry Blossom'
);

INSERT INTO world_items (name, description, price, category)
SELECT 'Spruce Tree', 'A tall evergreen spruce.', 20, 'tree'
WHERE NOT EXISTS (
    SELECT 1 FROM world_items WHERE name = 'Spruce Tree'
);
