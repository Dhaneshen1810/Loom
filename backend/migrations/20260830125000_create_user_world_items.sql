CREATE TABLE user_world_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    world_item_id UUID NOT NULL REFERENCES world_items(id) ON DELETE RESTRICT,
    tile SMALLINT NOT NULL CHECK (tile > 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tile)
);

CREATE INDEX user_world_items_world_item_id_idx
    ON user_world_items (world_item_id);
