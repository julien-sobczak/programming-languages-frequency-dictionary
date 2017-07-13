SELECT
  fqn,
  name,
  COUNT(*) count
FROM (
  extract_methods(
    SELECT
      content
    FROM
      [bigquery-public-data:github_repos.sample_contents]
    WHERE
      content CONTAINS 'class'
      AND sample_path LIKE '%.java' ))
GROUP BY
  fqn,
  name
ORDER BY
  count DESC
LIMIT
  10000;

# Output:
# - java-10000-most-frequent-members.csv
# - java-10000-most-frequent-members.json
