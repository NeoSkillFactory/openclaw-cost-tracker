#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

function parseArgs(argv) {
  const args = { format: "text", month: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--format" && argv[i + 1]) {
      args.format = argv[++i];
    } else if (argv[i] === "--month" && argv[i + 1]) {
      args.month = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "Usage: cost-tracker [--format text|json|csv] [--month YYYY-MM]\n" +
          "\nOptions:\n" +
          "  --format   Output format: text (default), json, csv\n" +
          "  --month    Reporting month in YYYY-MM format (default: current month)\n" +
          "  --help     Show this help message"
      );
      process.exit(0);
    }
  }
  return args;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw);
}

function getPeriod(monthArg) {
  const now = new Date();
  let year, month;

  if (monthArg) {
    const match = monthArg.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid month format: ${monthArg}. Use YYYY-MM.`);
    }
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10) - 1;
  } else {
    year = now.getFullYear();
    month = now.getMonth();
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const monthName = start.toLocaleString("en-US", { month: "long" });

  return {
    year,
    month: month + 1,
    monthName,
    start,
    end,
    label: `${monthName} ${year}`,
  };
}

function roundCost(value) {
  return Math.round(value * 100) / 100;
}

function collectProviderApiCosts(source) {
  if (!source || !source.enabled) return { items: [], total: 0 };

  const items = (source.items || []).map((item) => ({
    name: item.name,
    cost: roundCost(item.monthly_cost || 0),
    description: item.description || "",
  }));

  const total = roundCost(items.reduce((sum, i) => sum + i.cost, 0));
  return { items, total };
}

function collectSubscriptionCosts(source) {
  if (!source || !source.enabled) return { items: [], total: 0 };

  const items = (source.items || []).map((item) => ({
    name: item.name,
    cost: roundCost(item.monthly_cost || 0),
    description: item.description || "",
  }));

  const total = roundCost(items.reduce((sum, i) => sum + i.cost, 0));
  return { items, total };
}

function collectToolApiCosts(source) {
  if (!source || !source.enabled) return { items: [], total: 0 };

  const items = (source.items || []).map((item) => {
    let cost;
    if (item.monthly_cost != null) {
      cost = roundCost(item.monthly_cost);
    } else {
      const calls = item.calls || 0;
      const costPerCall = item.cost_per_call || 0;
      cost = roundCost(calls * costPerCall);
    }
    return {
      name: item.name,
      cost,
      calls: item.calls || null,
      description: item.description || "",
    };
  });

  const total = roundCost(items.reduce((sum, i) => sum + i.cost, 0));
  return { items, total };
}

function collectVpsCosts(source) {
  if (!source || !source.enabled) return { items: [], total: 0 };

  const items = (source.items || []).map((item) => ({
    name: item.name,
    cost: roundCost(item.monthly_cost || 0),
    description: item.description || "",
  }));

  const total = roundCost(items.reduce((sum, i) => sum + i.cost, 0));
  return { items, total };
}

function collectAllCosts(config) {
  const sources = config.sources || {};

  const providerApi = collectProviderApiCosts(sources.provider_api);
  const subscriptions = collectSubscriptionCosts(sources.subscriptions);
  const toolApis = collectToolApiCosts(sources.tool_apis);
  const vps = collectVpsCosts(sources.vps);

  const grandTotal = roundCost(
    providerApi.total + subscriptions.total + toolApis.total + vps.total
  );

  return {
    categories: {
      provider_api: providerApi,
      subscriptions,
      tool_apis: toolApis,
      vps,
    },
    grand_total: grandTotal,
  };
}

function formatCurrency(amount, symbol) {
  return `${symbol}${amount.toFixed(2)}`;
}

function formatTextReport(data, period, symbol) {
  const W = 50;
  const border = "\u2550".repeat(W);
  const divider = "\u2500".repeat(W - 2);
  const lines = [];

  lines.push(border);
  lines.push(`  OpenClaw Cost Report \u2014 ${period.label}`);
  lines.push(border);
  lines.push("");

  const categories = [
    { key: "provider_api", label: "Provider API Costs" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "tool_apis", label: "Tool API Costs" },
    { key: "vps", label: "VPS / Infrastructure" },
  ];

  for (const cat of categories) {
    const catData = data.categories[cat.key];
    if (catData.items.length === 0) continue;

    lines.push(`  ${cat.label}`);
    lines.push(`  ${divider}`);

    for (const item of catData.items) {
      let label = item.name;
      if (item.calls) label += ` (${item.calls} calls)`;
      const costStr = formatCurrency(item.cost, symbol);
      const padding = W - 2 - label.length - costStr.length;
      lines.push(`  ${label}${" ".repeat(Math.max(1, padding))}${costStr}`);
    }
    lines.push("");
  }

  lines.push(border);
  const totalLabel = "TOTAL";
  const totalStr = formatCurrency(data.grand_total, symbol);
  const totalPad = W - 2 - totalLabel.length - totalStr.length;
  lines.push(
    `  ${totalLabel}${" ".repeat(Math.max(1, totalPad))}${totalStr}`
  );
  lines.push(border);

  return lines.join("\n");
}

function formatJsonReport(data, period) {
  return JSON.stringify(
    {
      report: {
        period: period.label,
        year: period.year,
        month: period.month,
        generated_at: new Date().toISOString(),
      },
      ...data,
    },
    null,
    2
  );
}

function formatCsvReport(data, period, symbol) {
  const rows = [["Category", "Item", "Calls", `Cost (${symbol})`]];

  const categoryLabels = {
    provider_api: "Provider API",
    subscriptions: "Subscription",
    tool_apis: "Tool API",
    vps: "VPS / Infrastructure",
  };

  for (const [key, catData] of Object.entries(data.categories)) {
    for (const item of catData.items) {
      rows.push([
        categoryLabels[key] || key,
        item.name,
        item.calls != null ? String(item.calls) : "",
        item.cost.toFixed(2),
      ]);
    }
  }

  rows.push(["TOTAL", "", "", data.grand_total.toFixed(2)]);

  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const config = loadConfig(CONFIG_PATH);
    const period = getPeriod(args.month);
    const data = collectAllCosts(config);
    const symbol = config.currency_symbol || "$";

    let output;
    switch (args.format) {
      case "json":
        output = formatJsonReport(data, period);
        break;
      case "csv":
        output = formatCsvReport(data, period, symbol);
        break;
      case "text":
      default:
        output = formatTextReport(data, period, symbol);
        break;
    }

    console.log(output);
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  loadConfig,
  getPeriod,
  roundCost,
  collectAllCosts,
  collectProviderApiCosts,
  collectSubscriptionCosts,
  collectToolApiCosts,
  collectVpsCosts,
  formatCurrency,
  formatTextReport,
  formatJsonReport,
  formatCsvReport,
  parseArgs,
};

// Run if executed directly
if (require.main === module) {
  main();
}
