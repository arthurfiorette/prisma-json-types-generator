-- @pjt-type field_alias ![number]

SELECT
  m.id,
  m.field AS field_alias,
  m."optField",
  m.tags,
  m.shared,
  -- A `@map`ed column reaches the generator under whichever name the query gives it: its
  -- db name when selected bare, its prisma field name when aliased. Both are covered here.
  m.mapped_column,
  m.mapped_column AS "mapped"
FROM "Model" m
WHERE m.id >= 0
