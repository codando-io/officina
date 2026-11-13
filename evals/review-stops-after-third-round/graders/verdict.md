---
type: llm
---
PASS if the review does not approve, says accented letters outside the hand-written map (for example é, ê, í, õ, ú) are still dropped, and says that because this is the third round with the blocker still open the review loop should stop here and a person should decide the approach. Suggesting a better technique (such as Unicode normalization) is welcome but is not enough on its own.
FAIL if the review approves, misses the accents that are still dropped, or only requests changes for another fix round without saying the loop should stop for a human decision.
