# Blast radius

What a change breaks somewhere else. Listing callers is a search; the work is
the breakage a search does not show: the JSON a service returns, a database
column another job reads, a wire format parsed in another language, a flag,
timing and teardown order, code three hops downstream, a library's own source
at the pinned version.

Run it before design when a brief asserts something about existing code ("make
endpoint X public", "X already handles Y"): the assertion is a hypothesis, and
the list of consumers decides the design. Run it in `review` for R1 and R2
changes, and for a small diff you do not trust.

## Prove the one fact

A write-up that sounds right proves nothing. Most risky-looking changes are safe
because of one fact ("this call only drops entries that are already dead").
Find it, and move it as far down this ladder as is cheap, and say where it
stopped:

1. You said so. Worthless alone.
2. You pointed at the line: a real `file:line`, or the library's source.
3. You walked the failure step by step and showed it cannot happen.
4. You ran it: a script or test that calls the real code and fails loudly if
   you are wrong. Usually one small script that imports what the app ships.
5. You reproduced it in the running app.

A safety fact you could not get to step 4 is reported as unproven.

## Procedure

1. Read what the change does, including what the diff does not spell out.
2. Name the one fact the change is safe because of.
3. Look where search stops (the list above).
4. Give each real risk a likelihood and a cost. Cite `file:line`. A search that
   finds nothing is an answer; never invent a caller.
5. Prove the fact, and paste what the run printed.

## Report

What it does; the safety fact and its rung on the ladder; confirmed risks
(`file:line`, how it breaks, likelihood, cost, how to check); what you checked
and cleared; the cheapest test or script to run before merging.
