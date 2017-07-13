SELECT
  count(*)
FROM
  [bigquery-public-data:github_repos.sample_contents]
WHERE
  content CONTAINS 'class'
  AND sample_path LIKE '%.java'

# Output: 233318

