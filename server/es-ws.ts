import express from 'express'
import expressWs from 'express-ws';

const app = express();
// const hostname = process.env.wsHOST || '127.0.0.1';
// const port = process.env.wsPORT || 8000;
const hostname = 'wss://mystifying-mclean-b57411.netlify.com';
const port = 8000;

// WebSocket用のエンドポイントを追加
const ws = expressWs(app);

ws.app.ws('/ws', (ws:any, req: any) => {
  ws.on('message', (msg: any) => {
    console.log('from server: ' + msg)
  })
});

ws.app.listen({port, hostname});
console.log('Server listening on ' + hostname + ':' + port);


module.exports = (req: any, res: any) => {
  console.log("/es-ws!!!!");
};
