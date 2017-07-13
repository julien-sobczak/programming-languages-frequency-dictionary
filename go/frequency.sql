SELECT
  package,
  member,
  SUM(count) total
FROM (
  extract_methods(
    SELECT
      content
    FROM
      [bigquery-public-data:github_repos.sample_contents]
    WHERE
      content CONTAINS 'import'
      AND sample_path LIKE '%.go' ))
GROUP BY
  package, 
  member
ORDER BY
  total DESC
LIMIT
  5000;


# Output:
# - go-5000-most-frequent-members.csv
# - go-5000-most-frequent-members.json
