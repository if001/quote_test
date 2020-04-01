import * as http from 'http';
import express from 'express';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({server});

wss.on('connection', (ws) => {
  ws.on('close', () => {
    console.log('server: close!!!!')
  })

  ws.on('message', (message) => {
    console.log('server: get message %s', message);
    wss.clients.forEach((c) => {
      c.send(message)
    })
  })
})

server.listen(process.env.PORT || 8999, () => {
  console.log('Server started :)')
})


