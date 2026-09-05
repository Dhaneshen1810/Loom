ALTER TABLE user_world_items
    ADD COLUMN planted_on DATE;

UPDATE user_world_items
    SET planted_on = (purchased_at AT TIME ZONE 'UTC')::date
    WHERE planted_on IS NULL;

ALTER TABLE user_world_items
    ALTER COLUMN planted_on SET NOT NULL;

ALTER TABLE user_world_items
    DROP CONSTRAINT IF EXISTS user_world_items_user_id_tile_key;

ALTER TABLE user_world_items
    ADD CONSTRAINT user_world_items_user_id_tile_planted_on_key
    UNIQUE (user_id, tile, planted_on);
