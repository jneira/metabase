import d3 from "d3";
import { ICON_PATHS } from "metabase/icon_paths";

const ICON_X = -16;
const ICON_Y = 10;
const ICON_SIZE = 16;
const ICON_SCALE = 0.45;
const RECT_SIZE = ICON_SIZE * 2;
const TEXT_X = 10;
const TEXT_Y = 16;
const TEXT_DISTANCE = ICON_SIZE * 2;

function getAxis(chart) {
  return chart.svg().select(".axis.x");
}

function getScale(chart) {
  return chart.x();
}

function getEventMapping(events, scale) {
  const mapping = new Map();
  let group = [];
  let groupPoint = 0;

  events.forEach(event => {
    const eventPoint = scale(event.timestamp);
    const groupDistance = eventPoint - groupPoint;

    if (!group.length || groupDistance < ICON_SIZE) {
      group.push(event);
      groupPoint += (eventPoint - groupPoint) / group.length;
    } else {
      mapping.set(groupPoint, group);
      group = [event];
      groupPoint = eventPoint;
    }
  });

  if (group.length) {
    mapping.set(groupPoint, group);
  }

  return mapping;
}

function getEventPoints(eventMapping) {
  return Array.from(eventMapping.keys());
}

function getEventGroups(eventMapping) {
  return Array.from(eventMapping.values());
}

function isSelected(events, selectedEventIds) {
  return events.some(event => selectedEventIds.includes(event.id));
}

function getIcon(events) {
  return events.length === 1 ? events[0].icon : "star";
}

function getIconPath(events) {
  const icon = getIcon(events);
  return ICON_PATHS[icon].path ?? ICON_PATHS[icon];
}

function getIconFillRule(events) {
  const icon = getIcon(events);
  return ICON_PATHS[icon].attrs?.fillRule;
}

function getIconTransform() {
  return `scale(${ICON_SCALE}) translate(${ICON_X}, ${ICON_Y})`;
}

function getIconLabel(events) {
  const icon = getIcon(events);
  return `${icon} icon`;
}

function isEventWithin(eventIndex, eventPoints, eventDistance) {
  const thisPoint = eventPoints[eventIndex];
  const prevPoint = eventPoints[eventIndex - 1] ?? Number.NEGATIVE_INFINITY;
  const nextPoint = eventPoints[eventIndex + 1] ?? Number.POSITIVE_INFINITY;
  const prevDistance = thisPoint - prevPoint;
  const nextDistance = nextPoint - thisPoint;

  return prevDistance < eventDistance || nextDistance < eventDistance;
}

function hasEventText(events, eventIndex, eventPoints) {
  if (events.length > 1) {
    return !isEventWithin(eventIndex, eventPoints, TEXT_DISTANCE);
  } else {
    return false;
  }
}

function renderEventBrush({ chart }) {
  const g = chart.g();
  const margins = chart.margins();
  const brush = g.selectAll(".event-brush").data([0]);
  brush.exit().remove();

  brush
    .enter()
    .insert("g", ":first-child")
    .attr("class", "event-brush")
    .attr("transform", `translate(${margins.left}, ${margins.top})`);

  return brush;
}

function renderEventLines({
  chart,
  brush,
  eventPoints,
  eventGroups,
  selectedEventIds,
}) {
  const eventLines = brush.selectAll(".event-line").data(eventGroups);
  const brushHeight = chart.effectiveHeight();
  eventLines.exit().remove();

  eventLines
    .enter()
    .append("line")
    .attr("class", "event-line")
    .classed("hover", d => isSelected(d, selectedEventIds))
    .attr("x1", (d, i) => eventPoints[i])
    .attr("x2", (d, i) => eventPoints[i])
    .attr("y1", "0")
    .attr("y2", brushHeight);
}

function renderEventTicks({
  axis,
  brush,
  eventPoints,
  eventGroups,
  selectedEventIds,
  onHoverChange,
  onOpenTimelines,
  onSelectTimelineEvents,
  onDeselectTimelineEvents,
}) {
  const eventAxis = axis.selectAll(".event-axis").data([0]);
  const eventLines = brush.selectAll(".event-line").data(eventGroups);
  eventAxis.exit().remove();

  eventAxis
    .enter()
    .append("g")
    .attr("class", "event-axis");

  const eventTicks = eventAxis.selectAll(".event-tick").data(eventGroups);
  eventTicks.exit().remove();

  eventTicks
    .enter()
    .append("g")
    .attr("class", "event-tick")
    .classed("hover", d => isSelected(d, selectedEventIds))
    .attr("transform", (d, i) => `translate(${eventPoints[i]}, 0)`);

  eventTicks
    .append("path")
    .attr("class", "event-icon")
    .attr("d", d => getIconPath(d))
    .attr("fill-rule", d => getIconFillRule(d))
    .attr("transform", () => getIconTransform())
    .attr("aria-label", d => getIconLabel(d));

  eventTicks
    .append("rect")
    .attr("fill", "none")
    .attr("width", RECT_SIZE)
    .attr("height", RECT_SIZE)
    .attr("transform", () => getIconTransform());

  eventTicks
    .filter((d, i) => hasEventText(d, i, eventPoints))
    .append("text")
    .attr("class", "event-text")
    .attr("transform", `translate(${TEXT_X},${TEXT_Y})`)
    .text(d => d.length);

  eventTicks
    .on("mousemove", function(d) {
      const eventTick = d3.select(this);
      const eventIcon = eventTicks.filter(data => d === data);
      const eventLine = eventLines.filter(data => d === data);

      onHoverChange({ element: eventIcon.node(), timelineEvents: d });
      eventTick.classed("hover", true);
      eventLine.classed("hover", true);
    })
    .on("mouseleave", function(d) {
      const eventTick = d3.select(this);
      const eventLine = eventLines.filter(data => d === data);

      onHoverChange(null);
      eventTick.classed("hover", isSelected(d, selectedEventIds));
      eventLine.classed("hover", isSelected(d, selectedEventIds));
    })
    .on("click", function(d) {
      if (isSelected(d, selectedEventIds)) {
        onDeselectTimelineEvents();
      } else {
        onSelectTimelineEvents(d);
      }

      onOpenTimelines();
    });
}

export function renderEvents(
  chart,
  {
    events = [],
    selectedEventIds = [],
    isTimeseries,
    onHoverChange,
    onOpenTimelines,
    onSelectTimelineEvents,
    onDeselectTimelineEvents,
  },
) {
  const axis = getAxis(chart);

  if (!axis || !isTimeseries) {
    return;
  }

  const scale = getScale(chart);
  const eventMapping = getEventMapping(events, scale);
  const eventPoints = getEventPoints(eventMapping);
  const eventGroups = getEventGroups(eventMapping);

  const brush = renderEventBrush({ chart, eventGroups });

  renderEventLines({
    chart,
    brush,
    eventPoints,
    eventGroups,
    selectedEventIds,
  });

  renderEventTicks({
    axis,
    brush,
    eventPoints,
    eventGroups,
    selectedEventIds,
    onHoverChange,
    onOpenTimelines,
    onSelectTimelineEvents,
    onDeselectTimelineEvents,
  });
}

export function hasEventAxis({ timelineEvents = [], isTimeseries }) {
  return isTimeseries && timelineEvents.length > 0;
}
