---
title: "The Best AI Agent for a 5:30 AM Job Is No Agent at All"
date: 2026-09-27
draft: false
slug: "agentic-build-deterministic-run"
tags: ["architecture", "ai-agents", "adr", "claude", "automation", "decision-making", "llm"]
categories: ["Point of View"]
summary: "I needed a system that runs every morning at 05:30 with nobody watching. The fashionable answer was an autonomous agent. I built a scripted pipeline with exactly one model call instead. Here is the decision record, scored across five dimensions, and the rule I now apply to every automation brief."
disclaimer: true
---

{{< tldr >}}
**The decision:** Any job that runs while you sleep deserves the simplest tool that cannot surprise you. So the routine runs as a scripted pipeline, and the model is called exactly once — for the only step that needs a thinking mind. **Why:** Judged across five dimensions — reliability, cost, streak safety, security, flexibility — the pipeline wins four. The agent wins only flexibility, and most of that can be won at build time, while a person is still watching. Everything the agent improvises at 05:30, it improvises alone. **The rule:** Let the agent build the machine; let the machine do the work. Agentic at build time, deterministic at run time.
{{< /tldr >}}

In 2026, the default answer to "automate this" is "build an agent." Give a capable model some tools and a goal, and let it work out the steps.

I recently built a system that runs every morning at 05:30 on my Mac, with nobody watching. An agent was the obvious design. I chose not to build one. The system is a scripted pipeline that calls the model exactly once a day, and this post explains why, using the same decision record I would put in front of a steering committee.

## The job: five minutes on camera, every day

The system is a personal coach for the communication side of the Forward Deployed Engineer role: the moments where you explain a failure to an executive, push back on scope, or earn trust in a room you don't control.

Every morning it has to:

- write five impromptu questions I have never seen, each a little harder than the last;
- build a slide deck with a 60-second timer per question;
- record five minutes of me answering on camera;
- upload the video to my YouTube channel as a **private** video;
- keep reminding me, on the Mac and through Google Calendar, until I record.

One requirement outranks all the others: **the daily streak must never break.** A practice habit dies on the first morning the tool fails. That single sentence decided the architecture.

## Two ways to build it

**Option A: a scripted pipeline with one model call.** A macOS scheduler starts a Python program at 05:30. Code builds the deck, drives QuickTime and PowerPoint, and calls the YouTube and Google Calendar APIs. Claude is called once, headless, to write the five questions. Its answer is checked against a schema and against every question I have ever answered, and a curated bank of 132 questions stands behind it.

**Option B: an autonomous agent.** A scheduled Claude agent gets shell, file, API and computer-use tools plus a goal prompt: "run today's practice session." It decides each step as it goes.

Both options use the same model for the creative work. The difference is who runs everything else.

## The decision on one page

{{< inline_svg path="static/blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.svg" class="adr-diagram" >}}

[Open the diagram at full size]({{< imgurl "blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.svg" >}}) or [download the editable draw.io file]({{< imgurl "blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.drawio" >}}).

The same trade-off in text:

| Dimension | A: pipeline + one LLM call | B: autonomous agent | Winner |
|---|---|---|---|
| Reliability | 🟢 Strong | 🔴 Weak | A |
| Cost | 🟢 Strong | 🔴 Weak | A |
| Streak safety | 🟢 Strong | 🔴 Weak | A |
| Security & privacy | 🟢 Strong | 🟡 Mixed | A |
| Flexibility | 🟡 Mixed | 🟢 Strong | B |

## Why each dimension scored the way it did

### Reliability: the 05:30 problem

Nobody is awake at 05:30 to rescue a run. That changes what reliability means: not "usually works," but "does the same thing every morning."

Validating the pipeline on a Mac mini surfaced three real failures. macOS privacy controls blocked the scheduled job from reading its own scripts. QuickTime on macOS 26 saved recordings in an unexpected way. And the Mac mini had no camera at all. Each one became a code fix and, where possible, a test. Now the pipeline handles all three the same way, every morning.

An agent would meet the same walls each morning and improvise around them, possibly differently each time, with nobody there to notice. **A failure you fix once is an asset. A failure you rediscover daily is a liability.**

### Cost: paying for judgment where nothing needs judging

Most of the routine involves no decisions at all: build a deck, press record, upload a file. The pipeline spends model effort only on the one creative step, typically one short call a day (two if the first answer fails validation), and none on days it uses the bank.

An agent re-reasons the entire routine every morning, often with screenshots, and a single usage cap can stop the run. That is paying consulting rates for work a script does for free.

### Streak safety: design for the bad morning

The pipeline assumes something will fail and plans for it. If the model is unavailable, it uses the question bank. If an upload fails, the video is queued and retried. If the Mac was asleep at 05:30, a catch-up job builds the session when it wakes. If I still haven't recorded, reminders escalate through the day, and Google Calendar alerts can reach my phone even when the Mac is off.

In the agent design, the model is a single point of failure: if it is down or out of quota, nothing runs, and the day is lost.

### Security & privacy: shrink the blast radius

This system touches a camera, OAuth tokens and a YouTube channel. In the pipeline, each credential is used only by a specific, reviewed code path: the YouTube token uploads videos and sets their thumbnails, and the Calendar token creates or deletes the coach's own events. "Private" is hard-coded, not requested in a prompt.

An agent needs broad tools *and* live tokens inside a loop driven by text, which opens the door to prompt injection and plain mis-clicks. I scored it amber, not red, because allow-listed tools and sandboxing can reduce the risk. They reduce it; they don't remove it.

### Flexibility: the one the agent wins

This is the agent's real strength, and I scored it honestly. Ask an agent for something new and it adapts from a sentence. In the pipeline, new behaviour means new code.

But the gap is smaller than it looks, because I used an agent too, just at a different moment. Keynote support, a camera-less mode and YouTube thumbnails were each added by describing the change to Claude Code, which wrote the code and the tests. The flexibility arrived at build time, reviewed and tested, rather than improvised at 05:30.

## Where the agent did win: build time

Claude designed this system with me, wrote the 132-question bank and the roughly 3,500 lines of Python, produced 35 automated tests, and debugged the real-world failures on the Mac mini. That is agentic work, and it was the right place for it: a human was watching, changes were reviewed, and mistakes were cheap.

At 05:30 the system makes one bounded model call and no agent decisions.

**The agent's job is to change the system. The system's job is to run.**

## A rule of thumb for your next automation brief

| Choose an agent when… | Choose a pipeline when… |
|---|---|
| The path is unknown | The path is known and repeats |
| A person is watching | Nobody is watching |
| Failure is cheap and visible | Failure is costly or silent |
| It runs occasionally | It runs on a schedule |

Most production systems should be both: a deterministic spine, with model calls at the few steps that genuinely need judgment, and agents that build and maintain that spine.

In CARE terms, Clarity came from naming the one non-negotiable (the streak), and Reality came from validating the design on real hardware before trusting it. The trade-off matrix is simply Alignment made visible.

## When I will revisit this decision

A good decision record says what would change the answer. For this one:

- agents run unattended desktop tasks reliably, for months, without supervision;
- per-run model cost becomes negligible;
- the routine starts changing every week, so code changes become the bottleneck.

Until then, the coach stays a pipeline.

## Explore the project

- **Code:** [github.com/rajchampaneriya/fde-impromptu-coach](https://github.com/rajchampaneriya/fde-impromptu-coach)
- **Documentation:** [setup and usage guide](https://github.com/rajchampaneriya/fde-impromptu-coach/blob/master/fde-impromptu-coach/README.md), [how Claude Code uses the skill](https://github.com/rajchampaneriya/fde-impromptu-coach/blob/master/fde-impromptu-coach/SKILL.md), [design plan and risk review](https://github.com/rajchampaneriya/fde-impromptu-coach/blob/master/fde-impromptu-coach/references/plan.md), [troubleshooting](https://github.com/rajchampaneriya/fde-impromptu-coach/blob/master/fde-impromptu-coach/references/troubleshooting.md)
- **About the app:** [RajC FDE Impromptu Coach]({{< imgurl "fde-coach/" >}})
- **This decision record:** [editable draw.io file]({{< imgurl "blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.drawio" >}}), [SVG]({{< imgurl "blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.svg" >}}), [PNG]({{< imgurl "blog/2026/09/fde-coach/adr-001-pipeline-vs-agent.png" >}})
