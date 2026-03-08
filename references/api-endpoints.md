# API Endpoints and Data Sources

## Provider API Cost Sources

### Anthropic (Claude API)

- **Endpoint**: `https://api.anthropic.com/v1/usage`
- **Authentication**: Bearer token via `ANTHROPIC_API_KEY`
- **Rate Limit**: 60 requests/minute
- **Response Format**: JSON with `total_cost` and `breakdown` fields
- **Note**: When API access is unavailable, falls back to configured `monthly_cost`

### OpenAI (GPT API)

- **Endpoint**: `https://api.openai.com/v1/usage`
- **Authentication**: Bearer token via `OPENAI_API_KEY`
- **Rate Limit**: 60 requests/minute
- **Response Format**: JSON with usage breakdown by model

## Subscription Sources

Subscriptions are configured statically in `config.json` as they typically don't have usage-based APIs. Supported subscription types:

- Platform subscriptions (OpenClaw Pro, etc.)
- SaaS tool subscriptions
- Service tier fees

## Tool API Cost Sources

Tool APIs can be tracked in two ways:

1. **Static configuration**: Set `cost_per_call` and `calls` in config
2. **Log-based tracking**: Point `log_path` to a JSONL file with call records

### Log File Format (JSONL)

```json
{"timestamp": "2026-03-01T10:00:00Z", "tool": "web_search", "cost": 0.01}
{"timestamp": "2026-03-01T10:05:00Z", "tool": "web_search", "cost": 0.01}
```

## VPS / Infrastructure Sources

VPS costs are configured statically. Common providers:

| Provider | Typical Endpoint | Notes |
|----------|-----------------|-------|
| Hetzner | `https://api.hetzner.cloud/v1` | Billing via dashboard only |
| DigitalOcean | `https://api.digitalocean.com/v2/customers/balance` | API billing access |
| Linode | `https://api.linode.com/v4/account/invoices` | Invoice API available |

## Authentication

All API keys should be stored as environment variables, never in configuration files. The cost tracker reads credentials from:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `HETZNER_API_TOKEN`
- `DO_API_TOKEN`

If no API keys are configured, the tracker uses static values from `config.json`.
