-- Only described while generating, never executed
UPDATE users SET extra = $1 WHERE id = $2
RETURNING id, profile_data, extra
