import test from "node:test";
import assert from "node:assert/strict";
import { completedDays, serviceData } from "../assets/service-data.mjs";

test("date ranges use the dashboard's inclusive completed days", () => {
  assert.equal(completedDays("Oct 26, 2026"), 1);
  assert.equal(completedDays("Oct 1, 2026 \u2013 Oct 26, 2026"), 26);
  assert.equal(completedDays("Jan 1, 2026 \u2013 Oct 26, 2026"), 299);
  assert.equal(completedDays("Feb 28, 2024 \u2013 Mar 1, 2024"), 3);
  assert.throws(() => completedDays("not a date"));
  assert.throws(() => completedDays("Oct 26, 2026 \u2013 Oct 1, 2026"));
});

test("weekly illustrative values match the agreed content", () => {
  const data = serviceData(7, "year");
  assert.equal(data.ordering.revenue, 2840);
  assert.equal(data.ordering.orders, 142);
  assert.equal(data.calls.total, 86);
  assert.equal(data.calls.selfService, 64);
  assert.equal(data.calls.staffRequests, 22);
  assert.deepEqual(data.calls.topStaffReason, { label: "Ball Return", count: 12 });
  assert.equal(data.calls.selfServiceShare, 64 / 86 * 100);
  assert.equal(data.pictures.total, 420);
  assert.equal(data.pictures.approved, 392);
  assert.equal(data.pictures.rejected, 28);
  assert.equal(data.pictures.approvalRate, 93);
  assert.equal(data.interactions.total, 1280);
});

test("totals remain consistent for every supported period", () => {
  for (const days of [1, 7, 26, 299]) {
    for (const comparison of ["year", "previous"]) {
      const data = serviceData(days, comparison);
      assert.equal(data.ordering.revenue, data.ordering.orders * data.ordering.average);
      assert.equal(data.calls.total, data.calls.types.reduce((sum, type) => sum + type.count, 0));
      assert.equal(data.calls.total, data.calls.selfService + data.calls.staffRequests);
      assert.equal(data.calls.staffReasons.reduce((sum, reason) => sum + reason.count, 0), data.calls.staffRequests);
      assert.equal(data.calls.topStaffReason.count, Math.max(...data.calls.staffReasons.map(reason => reason.count)));
      assert.equal(data.calls.selfServiceShare, data.calls.selfService / data.calls.total * 100);
      assert.equal(data.calls.shareChange, data.calls.selfServiceShare - data.calls.referenceShare);
      assert.equal(data.pictures.total, data.pictures.approved + data.pictures.rejected);
      assert.equal(data.interactions.total, data.interactions.types.reduce((sum, type) => sum + type.count, 0));
      for (const [metric, value] of [
        [data.ordering, data.ordering.revenue],
        [data.interactions, data.interactions.total],
      ]) {
        assert.equal(metric.change, (value - metric.reference) / metric.reference * 100);
      }
    }
  }
});

test("comparison changes the reference, not the current metrics", () => {
  const year = serviceData(7, "year");
  const previous = serviceData(7, "previous");
  for (const key of ["ordering", "interactions"]) {
    assert.notEqual(year[key].reference, previous[key].reference);
  }
  assert.equal(year.ordering.revenue, previous.ordering.revenue);
  assert.equal(year.calls.total, previous.calls.total);
  assert.equal(year.calls.selfServiceShare, previous.calls.selfServiceShare);
  assert.notEqual(year.calls.referenceShare, previous.calls.referenceShare);
  assert.notEqual(year.calls.referenceStaffRequests, previous.calls.referenceStaffRequests);
  assert.equal(year.interactions.total, previous.interactions.total);
  assert.throws(() => serviceData(0, "year"));
  assert.throws(() => serviceData(7, "invalid"));
});
