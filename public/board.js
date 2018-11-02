const padding = 50;
const stroke = 3;
const w = 1000;
const h = 700;

const translate = (x, y) => `translate(${x}, ${y})`;

const makeId = () =>
  Math.random()
    .toString(36)
    .substring(3);

const makeSvg = () =>
  d3
    .select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("background-color", "#999");

const encode = d3
  .line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveNatural);

let socket = new WebSocket("ws://" + location.host);

const drawStrokes = (svg, strokes) => {
  svg.selectAll("path").remove();
  svg
    .selectAll("path")
    .data(Object.values(strokes))
    .enter()
    .append("path")
    .attr("id", stroke => stroke.id)
    .attr("stroke", "black")
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", stroke => encode(stroke.points));
};

d3.select("body")
  .style("background-color", "black")
  .style("text-align", "center");

socket.onopen = () => {
  (async () => {
    const svg = makeSvg();

    const strokes = {};

    svg.call(
      d3
        .drag()
        .container(function() {
          return this;
        })
        .on("start", () => {
          const { x, y } = d3.event;

          const stroke = {
            id: makeId(),
            points: [{ x, y }]
          };

          strokes[stroke.id] = stroke;

          d3.event.on("drag", () => {
            const { x, y } = d3.event;
            stroke.points.push({ x, y });
            drawStrokes(svg, strokes);
            socket.send(JSON.stringify(stroke));
          });
        })
    );

    socket.onmessage = m => {
      const stroke = JSON.parse(m.data);
      strokes[stroke.id] = stroke;
      drawStrokes(svg, strokes);
    };
  })();
};
