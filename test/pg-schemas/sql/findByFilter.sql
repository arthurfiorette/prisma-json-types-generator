-- @param {Json} $1:filter ![{ tag: string }]
-- @param {Json} $2:untyped an unannotated parameter keeps prisma's own input type

SELECT m.id
FROM "Model" m
WHERE m.field @> $1
  AND m.field @> $2
