-- Both tables are called "Post" and both columns "meta", only their origin tells them apart
SELECT p.id, p.meta, a.meta AS audit_meta
FROM "Post" p
JOIN audit."Post" a ON a.id = p.id
