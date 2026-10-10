const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
const viewsSource = readFileSync(path.join(__dirname, "../js/views.js"), "utf8");

function createAnalyticsHarness() {
  const arcs = [];
  const labels = [];
  const context2d = {
    arc(...args) { arcs.push(args); },
    beginPath() {},
    clearRect() {},
    fill() {},
    fillText(text) { labels.push(text); },
    lineTo() {},
    moveTo() {},
    scale() {},
    stroke() {}
  };
  const elements = {
    "analytics-chart-canvas": {
      hidden: false,
      width: 900,
      height: 300,
      getBoundingClientRect: () => ({ width: 900, height: 300 }),
      getContext: () => context2d
    },
    "analytics-empty-state": {
      hidden: true,
      textContent: "No verified AQI history available yet."
    },
    "analytics-data-status": { textContent: "" },
    "analytics-metric-select": { value: "outdoorAQI" },
    "analytics-automatic-actions": { textContent: "" },
    "analytics-manual-overrides": { textContent: "" },
    "analytics-indoor-average": { textContent: "" },
    "analytics-filter-life": { textContent: "" }
  };
  const context = vm.createContext({
    document: {
      getElementById: id => elements[id] || null,
      addEventListener() {}
    },
    window: { devicePixelRatio: 1 },
    State: { activeView: "analytics" },
    API: {},
    Utils: {}
  });
  vm.runInContext(appSource, context);
  return {
    app: vm.runInContext("App", context),
    elements,
    arcs,
    labels
  };
}

test("analytics chart plots only account readings whose actual timestamps match the selected range", () => {
  const harness = createAnalyticsHarness();
  const now = Date.now();
  const readings = [
    {
      metric: "outdoorAQI",
      value: 41,
      recordedAt: new Date(now - 60 * 60 * 1000).toISOString(),
      source: "Google Maps Platform Air Quality API (Universal AQI)",
      placeName: "Bengaluru, India"
    },
    {
      metric: "outdoorAQI",
      value: 87,
      recordedAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      source: "Google Maps Platform Air Quality API (Universal AQI)",
      placeName: "Bengaluru, India"
    },
    {
      metric: "indoorAQI",
      value: 25,
      recordedAt: new Date(now - 30 * 60 * 1000).toISOString(),
      source: "unverified",
      placeName: "Office"
    }
  ];

  harness.app.renderAnalyticsChart("24H", { readings });
  assert.equal(harness.arcs.length, 1);
  assert.equal(harness.elements["analytics-chart-canvas"].hidden, false);
  assert.equal(harness.elements["analytics-empty-state"].hidden, true);
  assert.match(harness.elements["analytics-data-status"].textContent, /1 verified provider reading/);
  assert.match(harness.elements["analytics-data-status"].textContent, /Bengaluru, India/);

  harness.arcs.length = 0;
  harness.app.renderAnalyticsChart("7D", { readings });
  assert.equal(harness.arcs.length, 2);

  harness.elements["analytics-metric-select"].value = "indoorAQI";
  harness.app.renderAnalyticsChart("24H", { readings });
  assert.equal(harness.arcs.length, 2);
  assert.equal(harness.elements["analytics-chart-canvas"].hidden, true);
  assert.equal(harness.elements["analytics-empty-state"].hidden, false);
  assert.match(harness.elements["analytics-empty-state"].textContent, /No verified AQI history available yet/);
});

test("analytics summary cards and empty state never invent counts, averages, or filter life", () => {
  const context = vm.createContext({ Utils: {} });
  vm.runInContext(viewsSource, context);
  const views = vm.runInContext("Views", context);
  const markup = views.renderAnalytics();
  assert.match(markup, /No verified AQI history available yet/);
  assert.match(markup, /No verified action history available/);
  assert.match(markup, /No verified indoor AQI history available/);
  assert.match(markup, /No filter-life measurement source is connected/);
  assert.doesNotMatch(markup, />12</);
  assert.doesNotMatch(markup, />3</);
  assert.doesNotMatch(markup, />38</);
  assert.doesNotMatch(markup, /88%|4,200 operating hours/);
});
