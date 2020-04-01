<template>
  <div>
    <div style="padding: 2em;">
      <h2>{{ isYourTurn ? "あなたのターン" : "相手のターン"}}</h2>
    </div>
    <div style="padding: 2em;">
      <h4>相手に渡す駒</h4>
      <span v-for="l in leftPiece" style="padding: 1.2em;"
            @click="selectToHandOver(l.id)" :style="selectedHandOverStyle(l.id)">
        <font-awesome-icon :icon="getIcon(l.id)" :style="getStyle(l.id)"/>
      </span>
      <div>
        <button @click="sendPiece()">渡す</button>
      </div>
    </div>

    <div style="padding: 2em;">
      <h4>受け取った駒</h4>
      <font-awesome-icon v-if="handedOverPiece" :icon="getIcon(handedOverPiece.id)" :style="getStyle(handedOverPiece.id)"/>
    </div>

    <div style="padding: 2em;">
      <h4>フィールド</h4>
      <div v-for="(field, x) in nowField" style="padding: 1.5em;">
        <span v-for="(id, y) in field"
              :key="y"
              style="padding: 1.5em;"
              :style="isSelect(x, y)"
              @click="selectField(x, y)">
          <span v-if="id === -1" style="background: white;font-size: 2.0em">--</span>
          <font-awesome-icon v-else :icon="getIcon(id)" :style="getStyle(id)"/>
        </span>
        <br>
      </div>
      <button @click="putPiece()">置く</button>
    </div>

    <div style="padding: 2em;">
      <button @click='callQuote()'>クオート</button>
    </div>

  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';
  import {
    Field,
    getAllPieces,
    Piece,
    pieceIcon,
    pieceStyle,
    HandOverPieceInfo,
    PutInfo,
    WsBody,
    Quote
  } from "~/models/models";
  import {Dictionary} from "~/node_modules/@types/express-serve-static-core";

  @Component({
    layout: 'default'
  })
  export default class Main extends Vue {
    wsc: WebSocket| null = null;

    leftPiece: Array<Piece> = getAllPieces();
    selectPieceID: number | null = null;
    handedOverPiece: HandOverPieceInfo | null = null;

    isFirstSender = false;
    isYourTurn = false;

    field = new Field();
    nowField = this.field.getField();

    putPosition = initPutPosition();

    mounted () {
      this.initWebSocket();
    }

    initWebSocket() {
      this.wsc = new WebSocket(process.env.WS_HOST || 'wss://localhost:8999');
      this.wsc.addEventListener('open', () => {
        console.log('client: connect!!!!')
      });


      this.wsc.addEventListener('message', (piece) => {
        const tmp: WsBody = JSON.parse(piece.data);
        if (tmp.kind === 'pieceInfo') {
          const pieceInfo: HandOverPieceInfo = tmp;
          this.isYourTurn = this.getIsYourTurn(pieceInfo.isFirst);
          if (this.isYourTurn) {
            this.handedOverPiece = pieceInfo;
            removePiece(this.leftPiece, pieceInfo.id);
          }
        } else if(tmp.kind === 'putInfo') {
          const putInfo: PutInfo = tmp;
          if (putInfo.posX !== -1 && putInfo.posY !== -1) {
            this.field.setPiece(putInfo.id, putInfo.posX,  putInfo.posY);
            this.nowField = this.field.getField();

            this.rerender();
          }
        } else if(tmp.kind === 'quote') {
          alert('クオート！！！！！')
        }
      });
    }

    sendPiece() {
      if (this.handedOverPiece) {
        alert('駒を置く場所を選択してください');
        return
      }
      if (!this.selectPieceID) {
        alert('相手に渡す駒を選択してください');
        return
      } else if (this.wsc && this.selectPieceID) {
        if (this.leftPiece.length === 16 && !this.isFirstSender) {
          this.isFirstSender = true;
        }
        const selectPiece: Piece | undefined = this.pieceFindById(this.selectPieceID);
        if (selectPiece) {
          this.wsc.send(JSON.stringify(toHandOverInfo(selectPiece, this.isFirstSender)));
          this.selectPieceID = null;
          this.isYourTurn = false;
          removePiece(this.leftPiece, selectPiece.id);
        } else {
          alert('hand over error!!!!!!')
        }
      }
    }

    putPiece() {
      if (!this.handedOverPiece) {
        alert('駒を置く場所を選択してください')
      } else if(this.wsc) {
        const pos = this.getPutPosition();
        if (isPositionSelected(pos)) {
          this.putPosition = initPutPosition();
          this.field.setPiece(this.handedOverPiece.id, pos.x, pos.y);
          this.nowField = this.field.getField();
          this.wsc.send(JSON.stringify(toPutInfo(this.handedOverPiece, pos)));

          this.handedOverPiece = null;
        } else {
          alert('put error!!!!');
        }
      }
    }

    getPutPosition(): Dictionary<number> {
      let x = -1;
      let y = -1;
      this.putPosition.forEach((v, i) => {
        v.forEach((v2, j) => {
          if (v2 === 1) {
            x = i; y = j;
          }
        })
      });
      return {x, y};
    }


    pieceFindById(id: number): Piece | undefined {
      return this.leftPiece.find((ele) => ele.id === id);
    }
    pieceFindByIdFromAll(id: number): Piece | undefined {
      return getAllPieces().find((ele) => ele.id === id);
    }

    getIsYourTurn(send: boolean): boolean {
      return send != this.isFirstSender
    }

    selectField(x: number, y: number) {
      if(this.handedOverPiece) {
        this.putPosition = initPutPosition();
        this.putPosition[x][y] = 1;
      }
    }
    isSelect(x: number, y: number): string {
      if (this.putPosition[x][y] === 1) {
        return 'border: 3px solid red;';
      } else {
        return 'border: 1px solid black;';
      }
    }



    getIcon(id: number): Array<string> {
      const piece = this.pieceFindByIdFromAll(id);
      if (!piece) return [];
      return pieceIcon(piece)
    }
    getStyle(id: number): Dictionary<string> {
      const piece = this.pieceFindByIdFromAll(id);
      if (!piece) return {};
      return pieceStyle(piece);
    }

    selectToHandOver(id: number) {
      this.selectPieceID = id;
    }
    selectedHandOverStyle(id: number):  Dictionary<string> {
      if (id === this.selectPieceID) {
        return { 'border': '3px solid black'};
      } else {
        return { 'border': ''};
      }
    }


    callQuote(){
      if(this.wsc) {
        this.wsc.send(JSON.stringify({kind: 'quote'} as Quote));
      }
    }

    rerender() {
      // todo なぜか再レンダリングされないので無理やり再レンダリング
      const tmp = this.selectPieceID;
      this.selectPieceID = 100000;
      this.selectPieceID = tmp;
    }
  }


  // static
  function isPositionSelected(pos: Dictionary<number>): boolean {
    return pos.x !== -1 && pos.y !== -1;
  }

  function removePiece(piece: Array<Piece>, removeID: number): Array<Piece> {
    const idx = piece.findIndex((x) => x.id === removeID);
    return piece.splice(idx, 1);
  }

  function toHandOverInfo(p: Piece, turn: boolean): HandOverPieceInfo {
    return {
      kind: 'pieceInfo',
      id: p.id,
      height: p.height,
      color: p.color,
      shape: p.shape,
      hole: p.hole,
      isFirst: turn
    }
  }

  function toPutInfo(p: Piece, pos: Dictionary<number>): PutInfo {
    return {
      kind: 'putInfo',
      id: p.id,
      height: p.height,
      color: p.color,
      shape: p.shape,
      hole: p.hole,
      posX: pos.x,
      posY: pos.y
    }
  }
  function initPutPosition(): Array<Array<number>> {
    return [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  }

</script>
