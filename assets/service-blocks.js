import "./index-00sNbllx.js";
import { completedDays, serviceData } from "./service-data.mjs";

const number = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const previousLabels = {
  day: "vs. the previous day",
  week: "vs. last week",
  month: "vs. last month",
  year: "vs. last year",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function card(title, icon, value, label) {
  const article = element("article", "service-card");
  const heading = element("h2", "service-title");
  const symbol = element("i", `bi ${icon}`);
  symbol.setAttribute("aria-hidden", "true");
  heading.append(symbol, document.createTextNode(title));
  article.append(
    heading,
    element("p", "service-value", value),
    element("p", "service-label", label),
  );
  return article;
}

function breakdown(items, withBars = false) {
  const list = element("dl", "service-breakdown");
  const total = items.reduce((sum, item) => sum + item.count, 0);
  for (const item of items) {
    const row = element("div", "service-detail");
    row.append(element("dt", "", item.label), element("dd", "", number.format(item.count)));
    if (withBars) {
      const track = element("span", "service-track");
      track.setAttribute("aria-hidden", "true");
      const bar = element("span", "service-fill");
      bar.style.width = `${item.count / total * 100}%`;
      track.append(bar);
      row.append(track);
    }
    list.append(row);
  }
  return list;
}

function metricBadge(text, tone = "neutral") {
  const badge = element("strong", `metric-change ${tone === "neutral" ? "service-badge-neutral" : `change-${tone}`}`, text);
  badge.setAttribute("data-v-de4d952b", "");
  return badge;
}

function comparisonLine(metric, label) {
  const footer = element("p", "service-comparison");
  footer.append(
    metricBadge(`${metric.change > 0 ? "+" : ""}${metric.change.toFixed(1)}%`, metric.change > 0 ? "positive" : metric.change < 0 ? "negative" : "neutral"),
    document.createTextNode(` ${label}`),
  );
  return footer;
}

const dashboard = document.querySelector(".statistics-dashboard");
const filters = dashboard?.querySelector(".filters-panel");
const existingServices = dashboard?.querySelector(".feature-grid");

if (!dashboard || !filters || !existingServices) {
  throw new Error("Cannot mount service blocks: dashboard filters or existing services are missing.");
}

const note = element("p", "service-demo-note", "Illustrative service data. No live integrations are connected.");
existingServices.before(note);
existingServices.classList.add("service-grid", "subscription-services");
existingServices.setAttribute("aria-label", "Subscription services and experiences");
const grid = existingServices;
const weather = dashboard.querySelector(".weather-panel");
const weatherBody = weather?.querySelector(".metric-body");
if (!weatherBody) {
  throw new Error("Cannot update weather layout: weather body is missing.");
}
const weatherVerdict = element("div", "weather-verdict");
weatherBody.append(weatherVerdict);
let previousState = "";

// This repository contains the published bundle only; use its public filter DOM,
// not private Vue internals. Preserve the existing Vue-owned service nodes.
function update() {
  const period = filters.querySelector('.period-buttons [aria-pressed="true"]')?.textContent.trim().toLowerCase();
  const selectedComparison = filters.querySelector('input[name="comparison"]:checked')?.value;
  const range = filters.querySelector(".selected-range span")?.textContent.trim();
  const comparison = period === "year" ? "year" : selectedComparison;
  const state = `${period}:${comparison}:${range}`;
  if (state === previousState) return;
  if (!Object.hasOwn(previousLabels, period) || !["year", "previous"].includes(comparison) || !range) {
    throw new Error("Cannot update service blocks: invalid dashboard filter state.");
  }
  const data = serviceData(completedDays(range), comparison);
  const comparisonLabel = comparison === "year" ? "vs. last year" : previousLabels[period];
  const precipitationText = weather.querySelector(".weather-row:last-child dd")?.textContent;
  const precipitationChange = Number.parseFloat(precipitationText);
  if (!Number.isFinite(precipitationChange)) {
    throw new Error("Cannot compare weather: precipitation change is invalid.");
  }
  const verdict = precipitationChange < 0 ? "Better" : precipitationChange > 0 ? "Worse" : "Unchanged";
  weatherVerdict.replaceChildren(
    element("strong", "", `${verdict} ${comparisonLabel}`),
    element("span", "", "Based on precipitation"),
  );
  const ordering = card("On Demand Ordering", "bi-bag", currency.format(data.ordering.revenue), "Value of lane-side orders");
  ordering.append(
    breakdown([
      { label: "Orders", count: data.ordering.orders },
    ]),
    element("p", "service-average", `${currency.format(data.ordering.average)} average order value`),
    comparisonLine(data.ordering, comparisonLabel),
  );

  const calls = card("Smart Service Calls", "bi-bell", `${data.calls.selfServiceShare.toFixed(1)}%`, "Self-service share of help interactions");
  const callComparison = element("p", "service-comparison");
  callComparison.append(
    metricBadge(`${data.calls.shareChange > 0 ? "+" : ""}${data.calls.shareChange.toFixed(1)} pp`),
    document.createTextNode(` self-service ${comparisonLabel}`),
  );
  const topReason = element("p", "service-average");
  topReason.append(
    document.createTextNode("Top staff call reason: "),
    element("strong", "service-change", data.calls.topStaffReason.label),
    document.createTextNode(` (${number.format(data.calls.topStaffReason.count)} of ${number.format(data.calls.staffRequests)} staff requests)`),
  );
  calls.append(
    breakdown(data.calls.types, true),
    topReason,
    callComparison,
  );

  const pictures = card("Smart Picture Validation", "bi-image", number.format(data.pictures.total), "Photos reviewed");
  const approvalBar = element("div", "service-approval-bar");
  approvalBar.setAttribute("aria-hidden", "true");
  const approved = element("span", "service-approved");
  approved.style.width = `${data.pictures.approved / data.pictures.total * 100}%`;
  approvalBar.append(approved);
  const pictureSummary = element("p", "service-comparison");
  pictureSummary.append(
    metricBadge(`${data.pictures.approvalRate}%`),
    document.createTextNode(" of reviewed photos approved"),
  );
  pictures.append(
    approvalBar,
    breakdown([
      { label: "Approved", count: data.pictures.approved },
      { label: "Rejected", count: data.pictures.rejected },
    ]),
    pictureSummary,
  );

  const interactions = card("Neoverse Interactions", "bi-stars", number.format(data.interactions.total), "Content interactions");
  interactions.append(breakdown(data.interactions.types), comparisonLine(data.interactions, comparisonLabel));
  ordering.classList.add("service-ordering");
  calls.classList.add("service-calls");
  pictures.classList.add("service-pictures");
  interactions.classList.add("service-interactions");
  for (const previousCard of grid.querySelectorAll(".service-card")) previousCard.remove();
  grid.append(interactions, pictures, ordering, calls);
  previousState = state;
}

update();
new MutationObserver(update).observe(filters, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["aria-pressed", "disabled"],
});
filters.addEventListener("change", update);
