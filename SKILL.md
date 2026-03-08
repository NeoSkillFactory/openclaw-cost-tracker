---
name: openclaw-cost-tracker
description: Automatically aggregates and reports all OpenClaw-related costs including provider APIs, subscriptions, and tool expenses in a comprehensive monthly report.
---

# openclaw-cost-tracker

## Purpose

This skill tracks and aggregates all OpenClaw-related costs (Provider API usage, subscription fees, tool API costs, VPS expenses) into structured monthly reports. It eliminates manual cost calculation by automatically collecting data from configured sources and producing clear breakdowns.

## Core Capabilities

- **Multi-source cost collection**: Gathers cost data from provider APIs, subscriptions, tool APIs, and VPS expenses
- **Monthly report generation**: Produces comprehensive reports with category breakdowns and totals
- **Dual interface**: CLI for direct use, JSON output for agent integration
- **Flexible periods**: Supports custom date ranges, defaults to current month
- **Export formats**: Human-readable CLI output and machine-readable JSON/CSV

## Out of Scope

- Cost optimization or reduction recommendations
- Third-party accounting system integration beyond CSV/JSON
- Real-time cost monitoring (periodic reporting only)
- Multi-currency handling or exchange rate calculations
- Cost forecasting or budget planning

## Trigger Scenarios

- "What's our total OpenClaw spending this month?"
- "Generate a cost report for OpenClaw usage"
- "Show me all API costs and subscription fees for the last 30 days"
- "Track and report our OpenClaw expenses"
- "Create a monthly OpenClaw cost breakdown"

## Required Resources

- `scripts/` - Main cost tracking script and utilities
- `references/` - Documentation about cost calculations and data sources

## Key Files

- `SKILL.md` - This file; skill documentation
- `scripts/cost-tracker.js` - Main executable for collecting and aggregating cost data
- `scripts/report-generator.js` - Formatting and report generation utility
- `scripts/config.json` - Configuration for data sources and reporting settings
- `references/calculation-formulas.md` - Cost calculation documentation
- `references/api-endpoints.md` - Data source endpoint documentation

## Acceptance Criteria

- Skill triggers correctly when users ask about cost tracking
- Cost data collection completes without errors
- Reports include all cost categories with accurate totals
- CLI provides clear output and handles errors appropriately
- Reports exportable in human-readable and machine-readable formats
- Agent workflow integration works without manual intervention
