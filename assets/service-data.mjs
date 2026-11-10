const dayInMilliseconds = 86400000;

// Weekly illustrative totals, scaled to the completed days in the existing filter.
const interactions = [
  { label: "Photo Pop", count: 620 },
  { label: "Celebrations", count: 340 },
  { label: "Billboards", count: 220 },
  { label: "Custom Pictures", count: 100 },
];

export function completedDays(range) {
  const dates = range.split(" \u2013 ");
  const start = Date.parse(`${dates[0]} UTC`);
  const end = Date.parse(`${dates[1] ?? dates[0]} UTC`);
  const days = (end - start) / dayInMilliseconds + 1;
  if (dates.length > 2 || !Number.isInteger(days) || days < 1) {
    throw new Error(`Invalid dashboard date range: ${range}`);
  }
  return days;
}

export function serviceData(days, comparison) {
  if (!Number.isInteger(days) || days < 1 || !["year", "previous"].includes(comparison)) {
    throw new Error("Service metrics require completed days and a valid comparison.");
  }

  const scale = (count) => Math.round(count * days / 7);
  const selfService = scale(64);
  const staffRequests = scale(22);
  const staffReasons = [
    { label: "Ball Return", count: scale(12) },
    { label: "Scoring assistance", count: scale(6) },
    { label: "Other Pinspotter Issue", count: staffRequests - scale(12) - scale(6) },
  ];
  const topStaffReason = staffReasons.reduce((top, reason) => reason.count > top.count ? reason : top);
  const callTypes = [
    { label: "Self-service actions", count: selfService },
    { label: "Staff requests", count: staffRequests },
  ];
  const referenceSelfService = scale(comparison === "year" ? 50 : 59);
  const referenceStaffRequests = scale(comparison === "year" ? 24 : 21);
  const referenceShare = referenceSelfService / (referenceSelfService + referenceStaffRequests) * 100;
  const contentTypes = interactions.map(({ label, count }) => ({ label, count: scale(count) }));
  const total = (items) => items.reduce((sum, item) => sum + item.count, 0);
  const orders = scale(142);
  const approved = scale(392);
  const rejected = scale(28);
  const photos = approved + rejected;
  const change = comparison === "year"
    ? { ordering: 18.3, interactions: 24.6 }
    : { ordering: 8.4, interactions: 9.2 };
  const revenue = orders * 20;
  const callCount = total(callTypes);
  const interactionCount = total(contentTypes);
  const comparisonMetric = (value, growth) => {
    const reference = Math.round(value / (1 + growth / 100));
    return { reference, change: (value - reference) / reference * 100 };
  };

  return {
    ordering: { orders, revenue, average: 20, ...comparisonMetric(revenue, change.ordering) },
    calls: {
      total: callCount,
      types: callTypes,
      selfService,
      staffRequests,
      staffReasons,
      topStaffReason,
      selfServiceShare: selfService / callCount * 100,
      referenceShare,
      shareChange: selfService / callCount * 100 - referenceShare,
      referenceStaffRequests,
    },
    pictures: { total: photos, approved, rejected, approvalRate: Math.round(approved / photos * 100) },
    interactions: { total: interactionCount, types: contentTypes, ...comparisonMetric(interactionCount, change.interactions) },
  };
}
