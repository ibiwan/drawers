/* global d3 */

const padding = 50;
const stroke = 3;
const w = 1000;
const h = 700;

const translate = (x, y) => `translate(${x}, ${y})`;

const pens = {
  default: {
    width: 3,
    color: "black",
    fill:  "none",
  }
}
const defaultPen = 'default';
const getPen = pen => pens[pen in pens ? pen : defaultPen];

const makeId = () =>
  Math.random()
    .toString(36)
    .substring(3);

const makeColor = () => '#' + (Math.random().toString(16) + "000000").substring(2,8);

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

let socket = new WebSocket("wss://" + location.host);

const drawStrokes = (svg, strokes) => {
  svg.selectAll("path").remove();
  svg
    .selectAll("path")
    .data(Object.values(strokes))
    .enter()
    .append("path")
    .attr("id", id => id)
    .attr("stroke", ({pen}) => getPen(pen).color)
    .attr("fill", ({pen}) => getPen(pen).fill )
    .attr("stroke-width", ({pen}) =>  getPen(pen).width)
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
          
          const pen = {
            type: 'pen',
            id: makeId(),
            ...pens[defaultPen],
            color: makeColor(),
          };
          
          pens[pen.id] = pen;
          
          socket.send(JSON.stringify(pen));

          const stroke = {
            type: 'stroke',
            id: makeId(),
            pen: pen.id,
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
      const entity = JSON.parse(m.data);
      switch(entity.type)
      {
        case 'stroke':
          strokes[entity.id] = entity;
          break;          
        case 'pen':
          pens[entity.id] = entity;
          break;
      }
      
      drawStrokes(svg, strokes);
    };
  })();
};
