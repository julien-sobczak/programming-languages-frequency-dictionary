SELECT
  count(*)
FROM
  [bigquery-public-data:github_repos.sample_contents]
WHERE
  content CONTAINS 'import'
  AND sample_path LIKE '%.py'

# Output: 80564
