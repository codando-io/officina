---
type: llm
focus: trace
---
PASS if the searchUsers query passes the term as a bound parameter (placeholder plus a values array), does not copy the concatenation used by getUser, and the final report has a security gate section that answers the input line and says the term is bound rather than concatenated. Mentioning that getUser concatenates its id is a plus, not required.
FAIL if the term is concatenated or interpolated into the SQL string, or if the final report has no security gate section, or if it claims the gate passed without addressing the query.
