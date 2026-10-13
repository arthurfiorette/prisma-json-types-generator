-- ![{ posts: number }] stats
-- [ProfileOverride] profile_data
-- ![{ tag: string }] "weird ""name"""
-- [WIP] prose like this is not an annotation
-- @param {Json} $1:filter [PostMetaFilter]
-- @param {String} $2:email [UserEmail]
-- @param {Int} $3:limit how many rows to return
SELECT
  u.profile_data,
  json_build_object('posts', count(p.id)) AS stats,
  json_build_object('tag', 'a') AS "weird ""name""",
  u.profile_data -> 'nested' AS unannotated
FROM users u
LEFT JOIN "Post" p ON p."authorId" = u.id AND p.meta @> $1
WHERE u.email = $2
GROUP BY u.id
LIMIT $3
