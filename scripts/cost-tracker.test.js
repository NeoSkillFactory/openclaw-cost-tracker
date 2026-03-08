const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const {
  loadConfig,
  getPeriod,
  roundCost,
  collectAllCosts,
  collectProviderApiCosts,
  collectToolApiCosts,
  formatCurrency,
  formatTextReport,
  formatJsonReport,
  formatCsvReport,
  parseArgs,
} = require("./cost-tracker");

const CONFIG_PATH = path.join(__dirname, "config.json");

describe("parseArgs", () => {
  it("returns defaults with no args", () => {
    const args = parseArgs(["node", "script"]);
    assert.equal(args.format, "text");
    assert.equal(args.month, null);
  });

  it("parses --format json", () => {
    const args = parseArgs(["node", "script", "--format", "json"]);
    assert.equal(args.format, "json");
  });

  it("parses --month", () => {
    const args = parseArgs(["node", "script", "--month", "2026-01"]);
    assert.equal(args.month, "2026-01");
  });
});

describe("loadConfig", () => {
  it("loads the default config.json", () => {
    const config = loadConfig(CONFIG_PATH);
    assert.equal(config.currency, "USD");
    assert.ok(config.sources);
    assert.ok(config.sources.provider_api);
  });

  it("throws on missing file", () => {
    assert.throws(() => loadConfig("/nonexistent/config.json"), {
      message: /not found/,
    });
  });
});

describe("getPeriod", () => {
  it("returns current month when no arg", () => {
    const p = getPeriod(null);
    const now = new Date();
    assert.equal(p.year, now.getFullYear());
    assert.equal(p.month, now.getMonth() + 1);
    assert.ok(p.label.length > 0);
  });

  it("parses YYYY-MM format", () => {
    const p = getPeriod("2026-02");
    assert.equal(p.year, 2026);
    assert.equal(p.month, 2);
    assert.equal(p.monthName, "February");
  });

  it("throws on invalid format", () => {
    assert.throws(() => getPeriod("2026/02"), { message: /Invalid month/ });
  });
});

describe("roundCost", () => {
  it("rounds to 2 decimal places", () => {
    assert.equal(roundCost(1.005), 1);
    assert.equal(roundCost(1.115), 1.12);
    assert.equal(roundCost(10.999), 11);
  });
});

describe("collectProviderApiCosts", () => {
  it("returns zero for disabled source", () => {
    const result = collectProviderApiCosts({ enabled: false, items: [] });
    assert.equal(result.total, 0);
    assert.equal(result.items.length, 0);
  });

  it("sums item costs", () => {
    const result = collectProviderApiCosts({
      enabled: true,
      items: [
        { name: "A", monthly_cost: 50 },
        { name: "B", monthly_cost: 30 },
      ],
    });
    assert.equal(result.total, 80);
    assert.equal(result.items.length, 2);
  });
});

describe("collectToolApiCosts", () => {
  it("calculates per-call costs", () => {
    const result = collectToolApiCosts({
      enabled: true,
      items: [{ name: "Search", cost_per_call: 0.01, calls: 500 }],
    });
    assert.equal(result.total, 5);
    assert.equal(result.items[0].cost, 5);
  });

  it("uses monthly_cost if set", () => {
    const result = collectToolApiCosts({
      enabled: true,
      items: [{ name: "Fixed", monthly_cost: 25 }],
    });
    assert.equal(result.total, 25);
  });
});

describe("collectAllCosts", () => {
  it("aggregates all categories from config", () => {
    const config = loadConfig(CONFIG_PATH);
    const data = collectAllCosts(config);
    assert.ok(data.grand_total > 0);
    assert.ok(data.categories.provider_api);
    assert.ok(data.categories.subscriptions);
    assert.ok(data.categories.tool_apis);
    assert.ok(data.categories.vps);
  });

  it("calculates correct grand total", () => {
    const config = loadConfig(CONFIG_PATH);
    const data = collectAllCosts(config);
    const expected =
      data.categories.provider_api.total +
      data.categories.subscriptions.total +
      data.categories.tool_apis.total +
      data.categories.vps.total;
    assert.equal(data.grand_total, roundCost(expected));
  });
});

describe("formatCurrency", () => {
  it("formats with symbol", () => {
    assert.equal(formatCurrency(201.99, "$"), "$201.99");
    assert.equal(formatCurrency(0, "€"), "€0.00");
  });
});

describe("formatTextReport", () => {
  it("includes period and total", () => {
    const config = loadConfig(CONFIG_PATH);
    const data = collectAllCosts(config);
    const period = getPeriod("2026-03");
    const text = formatTextReport(data, period, "$");
    assert.ok(text.includes("March 2026"));
    assert.ok(text.includes("TOTAL"));
    assert.ok(text.includes("$"));
  });
});

describe("formatJsonReport", () => {
  it("produces valid JSON with all fields", () => {
    const config = loadConfig(CONFIG_PATH);
    const data = collectAllCosts(config);
    const period = getPeriod("2026-03");
    const json = formatJsonReport(data, period);
    const parsed = JSON.parse(json);
    assert.ok(parsed.report);
    assert.equal(parsed.report.year, 2026);
    assert.equal(parsed.report.month, 3);
    assert.ok(parsed.grand_total > 0);
    assert.ok(parsed.categories);
  });
});

describe("formatCsvReport", () => {
  it("produces CSV with header and data rows", () => {
    const config = loadConfig(CONFIG_PATH);
    const data = collectAllCosts(config);
    const period = getPeriod("2026-03");
    const csv = formatCsvReport(data, period, "$");
    const lines = csv.split("\n");
    assert.ok(lines.length >= 2);
    assert.ok(lines[0].includes("Category"));
    assert.ok(lines[lines.length - 1].includes("TOTAL"));
  });
});
