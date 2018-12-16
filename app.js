const express = require("express");
const app = express();
var expressWs = require("express-ws")(app);

const port = 3000;

// serve up client page and app as static files
app.use(express.static("public"));
const v=0.04;

const strokes = {};

app.ws("/", function(ws, req) {
  // on any new connection to the web socket, send all existing drawing commands to the new client
  Object.values(strokes).forEach(stroke => {
    ws.send(JSON.stringify(stroke));
  });

  ws.on("message", function(msg) {
    // on any incoming drawing command:
    
    // ...append it to the list of drawing commands, and:
    const stroke = JSON.parse(msg);
    strokes[stroke.id] = stroke;
    
    // ...send the updated list to all clients...
    expressWs.getWss().clients.forEach(function each(client) {
      
      // ...except the one we got the change from, and closed connections
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    });
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
