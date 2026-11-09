-- Returns no rows. All queries are described in one batch, so this must not shift the
-- descriptions of the queries after it
UPDATE users SET name = name WHERE id = $1
