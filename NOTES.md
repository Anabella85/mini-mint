# Notes

## Summary

<!-- What you did, in a few sentences. What you'd like us to look at first. -->

## Bug fixes

### #1 Deleting the first step of a branch

- Root cause: `removeStep` deleted every connection of the removed step and built a new one
  from the _outgoing_ connection (`{ ...outgoing, sourceStepId }`), so it copied the outgoing
  outcome. Deleting _Create CRM customer_ (first step of the True branch) produced
  `If --Done--> Welcome email` instead of `If --True--> Welcome email`. The If then had two
  `Done` connections and no `True` one. `buildTree` follows the first `Done` it finds, so
  _Welcome email_ was still in `flow.steps` but no longer reachable, and not rendered.
  The bug only shows when the incoming outcome differs from `Done`, i.e. for the first step of
  a branch. That is why it went unnoticed on the main sequence.
- Fix: `removeStep` keeps the incoming connections and only moves their target to the removed
  step's successor. The outgoing connection is removed. If the removed step has no successor
  (last step of a branch), the incoming connection is removed and the branch becomes empty.
  The minimal fix would have been one line (take the outcome from the incoming connection).
  I chose to keep the connection instead of rebuilding it: the outcome, and any field a
  connection may get later, is preserved by construction, not by picking fields by hand. It is
  also how `insertStep` already rewires connections.
- How I verified it: reproduced the bug in the browser and logged `flow.connections` before
  and after the delete. The existing test asserted the buggy behaviour (`outcome: "Done"`);
  I fixed it to expect `True` and to check the rendered tree. Added tests for the only step of
  a branch, a step in the middle of a branch, the merge step of an If, and for extra fields on
  the incoming connection being kept. Checked that the corrected tests fail with the old code.

### #2 Switching flows quickly

- Root cause:
- Fix:
- How I verified it:

### #3 Unsaved changes / Discard

- Root cause:
- Fix:
- How I verified it:

### Other things I noticed

<!-- Problems you found that weren't reported. Which ones you fixed, and which ones you left (and why). -->

## Features

### A. Reference picker

<!-- Which outputs you offer, and why. Edge cases you thought about. -->

### B. Safe delete

<!-- How you find references, and why you did it that way. -->

## Decisions and assumptions

<!-- Anything that was unclear and how you decided. -->

## If I had more time

## AI usage

<!--
Which tools you used and for what.
A few examples of prompts or tasks you gave them.
What you kept, what you changed, and what you threw away (and why).
-->
