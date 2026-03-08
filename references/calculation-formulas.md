# Cost Calculation Formulas

## Provider API Costs

Fixed monthly costs are taken directly from configuration:

```
provider_api_total = SUM(item.monthly_cost) for each enabled item
```

If a `log_path` is configured, usage is parsed from log files:

```
provider_api_total = SUM(log_entry.tokens * cost_per_token)
```

## Subscription Costs

Subscriptions are fixed monthly fees:

```
subscription_total = SUM(item.monthly_cost) for each enabled item
```

## Tool API Costs

Tool APIs are calculated per-call:

```
tool_cost = item.cost_per_call * item.calls
tool_api_total = SUM(tool_cost) for each enabled item
```

If `monthly_cost` is set instead of per-call pricing, use the flat rate.

## VPS / Infrastructure Costs

VPS costs are fixed monthly amounts:

```
vps_total = SUM(item.monthly_cost) for each enabled item
```

## Grand Total

```
grand_total = provider_api_total + subscription_total + tool_api_total + vps_total
```

## Rounding

All monetary values are rounded to 2 decimal places using banker's rounding (round half to even) to avoid accumulation errors.

## Period Calculations

- **Current month**: First day of current month to today
- **Custom month**: Full calendar month specified by YYYY-MM format
- **Custom range**: Arbitrary start/end dates (costs are prorated for partial months)

### Proration Formula

```
prorated_cost = monthly_cost * (days_in_period / days_in_month)
```
