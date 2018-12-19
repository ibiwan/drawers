/* global d3 */

const padding = 50;
const w = 400;
const h = 200;

let svg;
let penSelector;
const strokes = {};

const pens = {
  default: {
    type:  'pen',
    id:    'default',
    width: 3,
    color: "black",
    fill:  "none",
  }
}
const defaultPen = 'default';
const getPen = pen => pens[pen in pens ? pen : defaultPen];

const translate = (x, y) => 
  `translate(${x}, ${y})`;

const makeId = () =>
  Math.random()
    .toString(36)
    .substring(3);

const makeColor = () => 
  '#' + (Math.random().toString(16) + "000000").substring(2,8);

const makeSvg = () =>
  d3
    .select("body")
    .append("svg")
    .attr("width",  w)
    .attr("height", h)
    .style("background-color", "#999");

const makePenSelector = () => 
  d3.select('body')
    .append('div')
    .attr('id', 'penSelector')
    .style('display', 'flex')
    .style('flex-direction', 'row')
    .style('flex-wrap', 'wrap');

const drawPens = pens => 
  penSelector  
    .selectAll(".pen")
    .data(Object.values(pens))
    .enter()
    .append('div')
    .attr('class', 'pen')
    .attr('id', pen => pen.id)
    .text(pen => pen.color)
    .style('background-color', '#ccc')
    .style('padding', 5)
    .style('margin', 15)
    .append('div')
    .style("width",  30)
    .style("height", 30)
    .attr('class', 'checkered3')
    .append('div')
    .style('border', pen => `solid ${pen.color} ${pen.width}px`)
    .style('background-color', pen => pen.fill)
    .style("width",  pen => 30 - pen.width)
    .style("height", pen => 30 - pen.width)

  
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

const init = () => {
  d3.select("body")
    .style("background-color", "black")
    .style("text-align", "center");
  
  svg = makeSvg();
  penSelector = makePenSelector();
  console.log({pens})
  drawPens(pens);
}

const makePen = (withOptions, fromPen) => {
  const pen = {
    ...(fromPen || pens[defaultPen]),
    id: makeId(),
    ...withOptions,
  };

  pens[pen.id] = pen;
  console.log('new pen', pen);
  drawPens(pens);

  socket.send(JSON.stringify(pen));
  
  return pen;
}

const makeRandomPen = () => {
  return makePen({
    color: makeColor(),
    fill: makeColor(),
    width: Math.floor(Math.random() * Math.floor(5))
  });
}

const handleDragContinue = (stroke) => () => {
  const { x, y } = d3.event;
  stroke.points.push({ x, y });
  drawStrokes(svg, strokes);
  socket.send(JSON.stringify(stroke));
}

const handleDragStart = () => {
  const { x, y } = d3.event;

  const pen = makeRandomPen();

  const stroke = {
    type:   'stroke',
    id:     makeId(),
    pen:    pen.id,
    points: [{ x, y }]
  };

  strokes[stroke.id] = stroke;

  d3.event.on("drag", handleDragContinue(stroke));
}

socket.onopen = () => {
  (async () => {
    init();

    svg.call(
      d3.drag()
        .container(function() {
          return this;
        })
        .on("start", handleDragStart)
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
      drawPens(pens);
    };
  })();
};
