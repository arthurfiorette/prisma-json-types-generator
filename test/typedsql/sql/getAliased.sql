-- Aliases, CTEs and subqueries in FROM keep pointing to the original column
WITH u AS (
  SELECT id, profile_data AS p FROM users
)
SELECT u.id, u.p AS "profile", sub.mail AS contact
FROM u
JOIN (SELECT id, email AS mail FROM users) sub ON sub.id = u.id
