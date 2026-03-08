#!/usr/bin/env node

"use strict";

const {
  formatTextReport,
  formatCsvReport,
  formatCurrency,
} = require("./cost-tracker");

function parseArgs(argv) {
  const args = { format: "text" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--format" && argv[i + 1]) {
      args.format = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "Usage: report-generator [--format text|csv]\n" +
          "\nReads JSON cost data from stdin and generates a formatted report.\n" +
          "\nOptions:\n" +
          "  --format   Output format: text (default), csv\n" +
          "  --help     Show this help message"
      );
      process.exit(0);
    }
  }
  return args;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("")));
    process.stdin.on("error", reject);

    // If stdin is a TTY (no piped data), provide usage info
    if (process.stdin.isTTY) {
      reject(
        new Error(
          "No input data. Pipe JSON cost data from cost-tracker.js:\n" +
            "  node cost-tracker.js --format json | node report-generator.js"
        )
      );
    }
  });
}

function parseInputData(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON input. Expected cost-tracker JSON output.");
  }

  if (!parsed.categories || parsed.grand_total == null) {
    throw new Error(
      "Invalid data structure. Expected cost-tracker JSON output with 'categories' and 'grand_total'."
    );
  }

  const period = parsed.report
    ? {
        label: parsed.report.period,
        year: parsed.report.year,
        month: parsed.report.month,
      }
    : { label: "Unknown Period", year: 0, month: 0 };

  return {
    data: {
      categories: parsed.categories,
      grand_total: parsed.grand_total,
    },
    period,
  };
}

function generateSummary(data, symbol) {
  const lines = [];
  lines.push("\nCategory Summary:");
  lines.push("─".repeat(40));

  const labels = {
    provider_api: "Provider APIs",
    subscriptions: "Subscriptions",
    tool_apis: "Tool APIs",
    vps: "VPS / Infra",
  };

  for (const [key, catData] of Object.entries(data.categories)) {
    if (catData.items.length === 0) continue;
    const label = labels[key] || key;
    const pct =
      data.grand_total > 0
        ? ((catData.total / data.grand_total) * 100).toFixed(1)
        : "0.0";
    lines.push(
      `  ${label.padEnd(20)} ${formatCurrency(catData.total, symbol).padStart(10)}  (${pct}%)`
    );
  }

  lines.push("─".repeat(40));
  lines.push(
    `  ${"Total".padEnd(20)} ${formatCurrency(data.grand_total, symbol).padStart(10)}`
  );

  return lines.join("\n");
}

async function main() {
  try {
    const args = parseArgs(process.argv);
    const raw = await readStdin();
    const { data, period } = parseInputData(raw);
    const symbol = "$";

    let output;
    switch (args.format) {
      case "csv":
        output = formatCsvReport(data, period, symbol);
        break;
      case "text":
      default:
        output = formatTextReport(data, period, symbol);
        output += "\n" + generateSummary(data, symbol);
        break;
    }

    console.log(output);
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { parseInputData, generateSummary, readStdin };

if (require.main === module) {
  main();
}
