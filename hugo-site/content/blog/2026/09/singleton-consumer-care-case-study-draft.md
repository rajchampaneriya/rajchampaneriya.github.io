---
title: "The Night Redundancy Broke Correctness: A CARE Case Study"
date: 2026-09-06
draft: true
slug: "singleton-consumer-care-case-study"
tags: ["architecture", "distributed-systems", "case-study", "azure", "software-engineering"]
categories: ["Architecture Work"]
summary: "A zone-redundant deployment silently doubled every message an integration platform processed. An anonymized walkthrough of how the CARE Architecture Method — Clarity, Alignment, Reality, Execution — turned a correctness incident into a self-healing architecture."
disclaimer: true
# Home page scroll story ("CARE in the field"). See CLAUDE.md → "Scroll story".
story:
  order: 2
  title: "The night redundancy broke correctness"
  metric: "Zero"
  metricLabel: "duplicate processing after the fix, zone redundancy intact"
  care:
    clarity: "Turned \"duplicates are bad\" into \"redundancy and singleton processing need explicit coordination.\""
    alignment: "Killed the tempting single-instance shortcut before it wasted anyone's time."
    reality: "Put three options through constraint-based trade-offs instead of preference-based debate."
    execution: "Contained the damage first, shipped the smallest correct change, and proved failover by causing it."
---

{{< tldr >}}
**In this case study:** A scale-out event gave an enterprise integration platform two instances of a message consumer that was only ever allowed to have one. Downstream systems began processing duplicates — silent, compounding, career-damaging. Walk through the four stages of the CARE Architecture Method (Clarity → Alignment → Reality → Execution) as applied to a real incident, and see why "just add redundancy" is the most expensive sentence in integration architecture.
{{< /tldr >}}

Every architecture leader fears the failure that doesn't page anyone.

Not the outage. The **silent one** — where the system stays up, dashboards stay green, and the data quietly goes wrong underneath you. Duplicate message processing is exactly that class of failure. Nothing crashes. Every downstream record simply exists twice.

This is the story of one such incident — anonymized, from a Fortune 500 integration platform — and how the CARE Architecture Method turned it from a recurring incident into a self-healing design.

<div class="process-flow scroll-reveal">
  <div class="process-step process-step--blue">
    <div class="process-step__number">C</div>
    <div class="process-step__title">Clarity</div>
    <div class="process-step__desc">Decompose ambiguity into actionable decisions</div>
  </div>
  <div class="process-arrow">→</div>
  <div class="process-step process-step--orange">
    <div class="process-step__number">A</div>
    <div class="process-step__title">Alignment</div>
    <div class="process-step__desc">Map technical direction to business outcomes</div>
  </div>
  <div class="process-arrow">→</div>
  <div class="process-step process-step--purple">
    <div class="process-step__number">R</div>
    <div class="process-step__title">Reality</div>
    <div class="process-step__desc">Validate with prototypes & structured frameworks</div>
  </div>
  <div class="process-arrow">→</div>
  <div class="process-step process-step--green">
    <div class="process-step__number">E</div>
    <div class="process-step__title">Execution</div>
    <div class="process-step__desc">Zero critical defects, on-time delivery</div>
  </div>
</div>

## The Incident

A zone-redundant deployment hosted an integration service consuming messages from a mature enterprise message broker. The platform team scaled the service out for availability.

Nobody asked one question first:

> **Must this workload stay a singleton?**

For this consumer, the answer was yes. The broker's client libraries offered no managed singleton consumer group. Two instances meant two live consumers on the same feed — and downstream systems started receiving **every message twice**.

The symptom arrived not as an alert, but as a anomaly someone noticed in downstream records. Confirmation came the honest way: matching message IDs in downstream logs.

## C — Clarity: Decompose the Ambiguity

The instinctive framing was "stop the duplicates." That framing produces patches — deduplication filters, idempotency keys, per-message firefighting. Each one treats the symptom and leaves the cause armed.

Clarity means reframing until the actual decision surfaces:

1. **Fact:** two consumers ran where the design permitted one.
2. **Fact:** the hosting tier must stay zone-redundant — HA was a business commitment, not a preference.
3. **Real question:** *how does a stateful singleton role survive inside a redundant deployment?*

That last line changed everything. This was not a message problem. It was a **coordination problem** — the classic conflict where redundancy and singleton processing collide by default. Once stated that plainly, the solution space shrank to mechanisms that provide mutual exclusion across instances.

## A — Alignment: Map the Fix to Business Outcomes

Three stakeholder commitments had to hold simultaneously:

- **Correctness** — downstream state could not tolerate duplicate processing.
- **Availability** — the zone-redundant tier stayed. Falling back to a single instance meant trading away an SLA commitment to fix a bug. That trade never survives the review.
- **No human-in-the-loop failover** — recovery had to be automatic. An on-call runbook is not an architecture.

Any option violating one of these was already dead. Alignment, applied early, is a filter that saves weeks.

## R — Reality: Test the Options Against Constraints

Three candidates went through a structured trade-off pass:

| Option | Verdict |
|---|---|
| **Single-instance tier** | Simple — but surrenders zone redundancy. Dead on arrival against the availability commitment. |
| **Deduplication queue in front** | Strongest delivery guarantees — but introduces an entire additional infrastructure component to own, monitor, and pay for. |
| **Blob lease distributed lock** | Keeps the redundant tier. One instance holds the lease and consumes; the other stands by. Lease expiry gives automatic takeover. |

The winner was the **storage blob lease lock**: the smallest change that preserved both zone redundancy and singleton processing, with failover built into the lease's TTL — no election service, no manual leader management.

```text
Instance A (lease holder)  ──► consumes messages ──► downstream
Instance B (standby)      ──► waits, retries lease acquisition
                 │
        A crashes → lease expires after TTL
                 │
        B acquires lease ──► consumes ──► downstream
```

## E — Execution: Contain First, Then Cure

Execution ran in two deliberate moves:

**1. Containment before root cause.** The second consumer was stopped immediately. Duplicates stopped flowing while the proper fix was designed — damage control measured in minutes, not meetings.

**2. The lease lock, then proof.** The standby was validated the way production actually fails: the leader was killed outright, and the standby acquired the lease **within the TTL window** and resumed processing — no manual intervention, no lost coverage.

After the change: **zero duplicate processing, zone redundancy intact, failover proven by deliberate failure.**

## What the Postmortem Added

Two refinements came out of the lessons learned, both now standing policy recommendations of mine:

- **Tag singleton workloads explicitly** in deployment templates, so a future scale-out event asks the question before the incident does.
- **Alert on duplicate detection** in downstream systems — the failure mode is silent by nature, so the observability must not be.

> Redundancy and correctness are both default requirements in modern platforms. For stateful roles — consumers, schedulers, single-threaded engines — they conflict **by default**. Choosing a coordination mechanism is not optional engineering; it is the engineering.

## The CARE Recap

- **Clarity** turned "duplicates are bad" into "redundancy and singleton processing need explicit coordination."
- **Alignment** killed the tempting single-instance shortcut before it wasted anyone's time.
- **Reality** put three options through constraint-based trade-offs instead of preference-based debate.
- **Execution** contained the damage first, shipped the smallest correct change, and proved failover by causing it.

This is what the CARE Architecture Method buys you on a bad day: not heroics — **a repeatable path from symptom to decision to proof.**

---

*Details in this case study have been anonymized; the architecture, constraints, and outcomes are presented as they occurred.*
