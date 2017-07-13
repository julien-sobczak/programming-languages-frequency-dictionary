SELECT
  name,
  SUM(count) total
FROM (
  extract_methods(
    SELECT
      content
    FROM
      [bigquery-public-data:github_repos.sample_contents]
    WHERE
      content CONTAINS 'import'
      AND sample_path LIKE '%.py' ))
GROUP BY
  name,
ORDER BY
  total DESC
LIMIT
  10000;

# Output:
# python-100000-most-frequent-words.csv
# python-100000-most-frequent-words.json
