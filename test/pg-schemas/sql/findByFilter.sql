-- @param {Json} $1:filter ![{ tag: string }]
-- @param {Json} $2:untyped an unannotated parameter keeps prisma's own input type
-- @param {String} $3:owner [UserIdString]
-- @param {String} $4:plainParam an unannotated parameter of any other kind is left alone

SELECT m.id
FROM "Model" m
WHERE m.field @> $1
  AND m.field @> $2
  AND m."userId" = $3
  AND m.plain = $4
