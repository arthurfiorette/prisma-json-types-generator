-- @pjt-type field_alias ![number]

SELECT
  m.id,
  m.field AS field_alias,
  m."optField",
  m.tags,
  m.shared
FROM "Model" m
WHERE m.id >= 0
