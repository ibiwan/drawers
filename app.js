const express = require("express");
const app = express();
var expressWs = require("express-ws")(app);

const port = 3000;

app.use(express.static("public"));

const strokes = {};

app.ws("/", function(ws, req) {
  Object.values(strokes).forEach(stroke => {
    ws.send(JSON.stringify(stroke));
  });

  ws.on("message", function(msg) {
    const stroke = JSON.parse(msg);
    strokes[stroke.id] = stroke;

    expressWs.getWss().clients.forEach(function each(client) {
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    });
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
