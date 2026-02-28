# Tab Hoarding Analyzer

A Chrome extension that measures the gap between tab lifespan and actual engagement.

Instead of tracking productivity, this analyzes behavioral patterns in how tabs are opened, revisited, and abandoned.

---

## Core Metric

active_ratio = active_time_ms / total_time_ms

This reveals the difference between intent (opening a tab) and actual engagement (time actively focused).

A tab open for 2 hours with 3 minutes of active use has a 2.5% active ratio — a strong signal of unfinished intent.

---

## Features

- Tracks tab open/close lifecycle
- Measures active focus time using Chrome APIs
- Scroll depth tracking
- Interactive dashboard
- Active Ratio distribution analysis
- Domain-level engagement breakdown
- Guilt Tab detection + cleanup
- Weekly behavioral insights (integration in progress)

---

## Guilt Tabs

“Guilt tabs” are defined as:

- Open for at least 5 minutes
- Active ratio under 10%

These represent tabs that linger without meaningful engagement.

The dashboard surfaces:
- Worst offenders (long open time, low engagement)
- Still-open low-engagement tabs
- Active ratio per guilt tab
- Total guilt tab count per week

This turns passive browsing clutter into a visible behavioral signal.


---

## Current Status

v0.1 — Core tracking, Active Ratio analytics, and Guilt Tab detection working  
Next: deeper behavioral modeling + structured weekly insight layer