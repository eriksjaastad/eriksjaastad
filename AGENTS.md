# Repository instructions

<!-- BEGIN runtime-doctor:shared:code-review-rules -->
## Code Review Rules

> Shared source: `agent-runtime-config/shared_blocks/code-review-rules.md`, kept
> in sync with its registry-declared authoring surface. Refresh through the
> shared-rule rollout; do not hand-copy rules into individual projects.

These rules apply to Codex and Claude local reviewers and GitHub Codex review.
Codex is primary; Claude remains supported. This block contains the essential
checks for in-repository review without requiring workstation files. Additional
local detail: [full protocol](https://github.com/eriksjaastad/agent-runtime-config/blob/main/docs/code-review-protocol.md).

### Mechanical checks

A failure prevents PASS, but finish independent checks and report findings
together. Name any check that could not run.

| ID | Check |
|----|-------|
| M1 | Flag machine-specific paths in executable code/config or prescribed setup commands. Illustrative examples and committed evidence are not runtime dependencies. |
| M2 | Flag swallowed unexpected failures. Documented best-effort and expected-absence handling are valid when the contract is preserved. |
| M3 | No real credentials in files. Secrets come from Doppler. Synthetic fixtures and documented placeholders are permitted. |
| M4 | No unresolved placeholders in rendered deliverables or runtime config. Source templates and literal fixtures may contain them. |
| M5 | For changed `.js` under any `static` directory, run from the project root: `npx eslint --no-config-lookup --rule '{"no-redeclare": "error"}' <paths>`. Exit0 passes; skip if none. |

### Judgment and scope

| ID | Check |
|----|-------|
| T1 | Identify the relevant behavior passing tests never exercise. |
| T2 | Assertions such as non-null/type checks alone are insufficient for behavioral claims. |
| E1 | Status contracts must be truthful. JSON deny with exit0 is valid if the caller consumes that protocol. |
| E2 | An operation failure must not silently become a successful empty result. |
| H1 | Subprocesses need timeouts and return-code handling; expected nonzero outcomes must remain usable. |
| H5 | Document foreign-key relationships before a DELETE, including cascade effects. |
| H7 | No unrequested destructive cleanup. |

Trace changed behavior to an authorized requirement. State the scope and check
claimed workflows; a written exclusion does not excuse a defect in behavior the
change promises. Separate unrelated pre-existing concerns from this PR's fixes.
Read propagation sources first, execution-critical code next, then reference docs.

### Evidence and convergence

- Review the whole diff and affected callers. Gather the complete supported
  finding set in one report; group related cases by root cause, most severe first.
- Check both failures and legitimate uses. Use focused synthetic probes where
  they materially validate a claim; do not turn review into an exhaustive audit.
- Separate evidence, inference and unchecked coverage. No supported findings is
  a valid result. Give each finding a concrete failure scenario and file/line.
- Compare base, previous reviewed revision and current head. Distinguish inherited
  misses from fix-induced regressions and verify prior fixes' adjacent effects.
- Test neighbouring legitimate behavior before requesting review. Batch corrections;
  a repeated regression family requires reassessing the approach, not another
  isolated patch. Local preflight also consumes resources and must stay bounded.

### Three GitHub review cycles: assess the result

Keep automatic GitHub Codex review on. The initial execution counts. Persist the
work item's distinct review cycles, request/acknowledgement evidence, head SHAs
and outcomes in its PR/task notes. Multiple comments or reactions from one cycle
are not multiple reviews. Count acknowledged failed/stalled executions; resolve
uncertain history before triggering another. Follow the full PR policy's counting
rules before pushes, ready transitions, requests, retries and merges.

The third cycle may be requested after fixes and preflight. At that request or
detection of an automatic third cycle, all agents on that work item stop edits,
commits, pushes, draft/ready flips, further review requests and merges. Let that
review finish. A clean third review on the unchanged recorded head may merge
when CI and all other gates pass, without extra approval solely for its count.
If findings remain, report the PR, SHA, findings, cycle evidence and recurring
patterns to Erik; stop further fixes or requests until he directs the next step.
Pending, unknown, ambiguous or stale evidence is not clearance; existing wait
limits and unrelated user holds still apply. Do not reset the count by
changing agents/sessions/branches or splitting/recreating the PR. A fourth cycle
requires Erik's explicit direction; this never waives correctness or CI.

### Verdict and publication

Local/delegated verdicts end PASS or FAIL with the exact reviewed commit SHA;
a new commit requires fresh review. GitHub reviewers use the integration's normal
finding/clean-result format. Review itself needs no workstation-tool access.

Publishing/merging agents follow the complete [PR review and merge policy](https://github.com/eriksjaastad/agent-runtime-config/blob/main/docs/pr-review-policy.md),
also mirrored in `pt info get pr_merge_policy` and `~/projects/Project-workflow.md`.
A local PASS is preflight only. GitHub clearance must identify the current head
and clear findings; pending, stale, missing or ambiguous evidence is insufficient.
Qualifying clean summaries or fresh observed-cycle thumbs-up can count under the
full policy. If that policy is unavailable, stop publication/merging, not review.
Third-review findings require a human discussion; clean third-review clearance
follows the normal merge gates. An authorized exception is recorded as an
exception, never as PASS.
<!-- END runtime-doctor:shared:code-review-rules -->
