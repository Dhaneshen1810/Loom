ALTER TABLE focus_sessions
    ADD COLUMN goal_description TEXT;

ALTER TABLE focus_sessions
    ADD CONSTRAINT focus_sessions_goal_description_len_chk
    CHECK (goal_description IS NULL OR char_length(goal_description) <= 140);
