---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

# Swarm

## Runtime

Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
4. Pick the worker model from the `swarm workers` line in `.agents/pstack-models.md`. With no override, inherit the current session model; panels use three workers. For `auto` or `inherit-parent`, omit `model` so the workers run on the parent model. Resolve unavailable model IDs and unsupported options through the harness contract. Never guess a replacement ID.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers in one message with a general-purpose worker, background execution when supported, and the step 4 model, left unset for `auto` or `inherit-parent`. Use the actual isolation supplied by the host. Local workers need separate worktrees or output directories; a remote worker must explicitly provide its environment and returned artifacts.

When a worker must start from a non-default branch, check that branch out in the worker's own worktree and name the worktree path in its brief.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.

## Model configuration

Read `.agents/pstack-models.md` when present. Resolve role values, inherited defaults, reasoning effort, and provider identity through the harness contract. Without an override, inherit the current session model. Panel defaults are three independent workers when delegation is available.
