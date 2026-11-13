---
title: "Stock Market Simulator"
date: 2026-01-23
draft: false
slug: "stock-market-simulator"
tags: ["architecture", "real-time", "event-driven", "redis-streams", "sse", "dotnet-10", "d3js"]
categories: ["Architecture Work"]
summary: "A real-time market data simulation system built for architects and leaders. Clean layered design, sub-100ms latency, and deliberate technology choices—Redis Streams, SSE, quantitative price models—documented for clarity and reuse."
cover:
  image: "/images/project/stock-market-simulator/front-end-chart-full.png"
  alt: "Stock Market Simulator — live candlestick charts with real-time streaming data"
  caption: "It's hard to think about volume in a two-dimensional space."
  hidden: true
githubRepo: "https://github.com/rajchampaneriya/stock-market-simulator"
weight: 1
ShowToc: true
disclaimer: true
audioTitle: "Stock Market Simulator"
# Articles that share this series are listed on this project's card on /work/.
series: ["Stock Market Simulator"]
# Home page scroll story ("CARE in the field"). See CLAUDE.md → "Scroll story".
story:
  order: 3
  metric: "<100 ms"
  metricLabel: "latency, streaming live market data to the browser"
---

<div class="content-callout">

> **At a glance:** A real-time market data simulation system, built for **architects** and **leaders**. Clean layered design, sub-100ms latency, and deliberate technology choices—Redis Streams, SSE, quantitative price models—documented for clarity and reuse.

</div>

## What It Is

The Stock Market Simulator is a **real-time market data simulation system** that generates statistically realistic synthetic prices and streams them to a web UI. Four Indian symbols—**NIFTY50**, **BANKNIFTY**, **RELIANCE**, and **TCS**—are simulated with distinct volatility profiles. Data flows from a price engine through a message broker to the browser via Server-Sent Events, creating a practical reference for event-driven, low-latency architecture.

**Why it matters for leadership:** The system demonstrates how to achieve reliability, scalability, and observability with a small set of well-chosen patterns—consumer groups, bounded channels, event streaming—without the overhead of heavier enterprise middleware. It is documented with formal Architecture Decision Records and C4-style diagrams in the [repository](https://github.com/rajchampaneriya/stock-market-simulator).

---

## Logical Architecture

The system is organized in four logical layers: **Presentation**, **Application**, **Integration & Data**, and **Data Source**. The diagram below is the single source of truth for how capabilities are grouped and how data and control flow between them.

<figure class="project-diagram project-diagram-hero">
  {{< projectimg src="images/project/stock-market-simulator/logical-architecture.svg" alt="Logical Architecture: Presentation (Trader/Viewer, Web Frontend), Application (Market Ingestion API, Broker Service, OpenTelemetry), Integration and Data (Redis Streams), Data Source (Market Simulator)" width="1200" height="720" priority="true" >}}
  <figcaption>Logical architecture — Presentation, Application, Integration &amp; Data, Data Source. For C4 and sequence diagrams see the <a href="https://github.com/rajchampaneriya/stock-market-simulator">repository</a>.</figcaption>
</figure>

| Layer | Capabilities |
|-------|---------------|
| **Presentation** | Trader/viewer (actor), Web frontend (React, TypeScript, D3) |
| **Application** | Market Ingestion API, Broker Service (SSE, aggregation), OpenTelemetry (OTLP) |
| **Integration & Data** | Redis Streams (message broker, consumer groups) |
| **Data Source** | Market Simulator (price generation: GBM, GARCH) |

---

## How It Flows

Data is **generated** by the Market Simulator (quantitative models), **ingested** and validated by the API, **stored** and distributed via Redis Streams, and **consumed** by the Broker Service, which aggregates candlesticks and streams updates to the Web Frontend over SSE. End-to-end latency is sub-100ms. Deployment is orchestrated with .NET Aspire (single `dotnet run`); Redis is provisioned via Docker. For detailed data-flow and sequence diagrams, see the [reference docs and mermaid diagrams in the repo](https://github.com/rajchampaneriya/stock-market-simulator/tree/main/reference-docs).

<figure class="project-diagram project-diagram-flow">
  {{< projectimg src="images/project/stock-market-simulator/train-simulator.svg" alt="End-to-end data flow: price generation through Redis Streams to browser charts" width="1200" height="auto" >}}
  <figcaption>End-to-end flow: ticks travel from the price engine through Redis Streams to live browser charts.</figcaption>
</figure>

### See it in action

The app runs with a single command. Below, a short tour of the working prototype—live UI, Aspire dashboard, and development setup. Auto-advances when in view; use **Pause** to hold on a slide.

{{< screenshot_carousel images="images/project/stock-market-simulator/screenshot-ui-chart.png, images/project/stock-market-simulator/screenshot-chart-watchlist.png, images/project/stock-market-simulator/screenshot-aspire-resources.png, images/project/stock-market-simulator/screenshot-aspire-graph.png, images/project/stock-market-simulator/screenshot-debug-vscode.png" interval="3" >}}

---

## Quality Attributes

- **Performance** — Sub-100ms latency; bounded channels and backpressure so slow clients do not affect others.
- **Scalability** — Horizontally scalable brokers using Redis consumer groups; stateless services for load balancing.
- **Reliability** — SSE reconnection with Last-Event-ID replay; Redis persistence; health checks and ordered startup via Aspire.
- **Observability** — OpenTelemetry (OTLP) across .NET services; Redis monitoring in the UI; structured logging.
- **Maintainability** — Clear separation of services; shared contracts; dependency injection; 10 ADRs for major decisions.

---

## Key Architectural Decisions

The project maintains **10 formal ADRs** in the repository. Summary for executives and architects:

| Decision | Rationale |
|----------|-----------|
| **Redis Streams** over Kafka/RabbitMQ | Consumer groups, ordering, bounded retention, and lower operational complexity for this scale. |
| **SSE** over WebSockets | Server-to-client only; native reconnection and Last-Event-ID; simpler and proxy-friendly. |
| **Backend candlestick aggregation** | Single source of truth; consistent candle boundaries and OHLCV across all clients. |
| **Custom D3.js charts** | Full control and no licensing dependency; TradingView-style UX without the library. |

Deep dives, alternatives considered, and tradeoffs are in the [ADR folder](https://github.com/rajchampaneriya/stock-market-simulator/tree/main/reference-docs) in the repo.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Orchestration | .NET Aspire |
| Backend | .NET 10 |
| Message broker | Redis Streams 7.x |
| Frontend | React 19, TypeScript 5.9, MUI 7, D3.js 7.9 |
| Build | Vite 7 |
| Observability | OpenTelemetry (OTLP) |

---

## Future Directions

1. Historical data replay from Redis stream history  
2. Technical indicators (e.g. MACD, RSI, Bollinger Bands) on charts  
3. Multi-timeframe aggregation (1m, 5m, 1h)  
4. Order book simulation and market depth  
5. Authentication and per-user watchlists  

---

## Conclusion

The Stock Market Simulator shows how a **focused set of architecture decisions**—event streaming, consumer groups, SSE, backend aggregation—yields a system that is reliable, scalable, and observable. The value for architects and leaders is in the clarity of the logical design and the documented rationale; for senior engineers, the repo provides full C4 and mermaid diagrams, ADRs, and implementation details.

<div class="content-callout">

> **"The quality of your work reflects the quality of your thinking. Build systems that think clearly."**

</div>

**Detailed diagrams and ADRs:** [Stock Market Simulator repository](https://github.com/rajchampaneriya/stock-market-simulator) — C4 model, mermaid diagrams, and Architecture Decision Records are maintained in the repo.

---

## Acknowledgments & Disclaimer

<div class="content-callout">

> The quantitative models in this project (Geometric Brownian Motion, GARCH) and the broader approach to market simulation draw inspiration from the published research, books, and writings of quantitative finance practitioners and academics. Their contributions to stochastic modelling and financial engineering have shaped how I approach real-time system design — and I reference them here with gratitude, not affiliation.
>
> All opinions, architectural decisions, and conclusions are entirely my own. No individual or organisation mentioned has endorsed, reviewed, or contributed to this project. Any errors in applying financial models or interpreting market behaviour are mine alone.
>
> **This project is a technical architecture demonstration, not financial advice.** Simulated symbols (NIFTY50, BANKNIFTY, RELIANCE, TCS) are used for illustrative purposes only and do not represent real market data or trading recommendations. Views expressed do not represent IBM, any client, or any organisation referenced in this project.

</div>

---

*Last Updated: February 2026*
