import {Dictionary} from "~/node_modules/@types/express-serve-static-core";

export type WsBody = PutInfo | HandOverPieceInfo | Quote;


export interface PutInfo extends Piece {
  kind: 'putInfo';
  posX: number;
  posY: number;
}

export interface HandOverPieceInfo extends Piece {
  kind: 'pieceInfo';
  isFirst: boolean;
}

export interface Piece {
  id: number;
  height: boolean;
  color: boolean;
  shape: boolean;
  hole: boolean;
}

export interface Quote {
  kind: 'quote'
}

export function getAllPieces(): Array<Piece> {
  const t: Array<boolean> = [true, false];
  const pieces: Array<Piece> = [];
  let idx = 0;
  for(let i of t) {
    for(let j of t) {
      for(let k of t) {
        for(let l of t) {
          pieces.push({
            id: idx,
            height:i,
            color:j,
            shape:k,
            hole:l
          });
          idx += 1;
        }
      }
    }
  }
  return pieces;
}

export function pieceIcon(p: Piece): Array<string> {
  const shape = (() => {
    if (p.shape) {
      return 'circle';
    } else {
      return 'square';
    }
  })();
  const hole = (() => {
    if (p.hole) {
      return 'fas';
    } else {
      return 'far';
    }
  })();
  return [hole, shape];
}

export function pieceStyle(p: Piece): Dictionary<string> {
  let style: Dictionary<string> = {};
  if (p.height) {
    style['font-size'] = '2.0em';
  } else {
    style['font-size'] = '1.0em';
  }

  if(p.color) {
    style['color'] = 'red';
  } else {
    style['color'] = 'blue';
  }
  return style
}

export class Field {
  field = [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]];
  getField():Array<Array<number>> {
    return this.field
  }
  setPiece(id:number, posX:number, posY: number) {
    this.field[posX][posY] = id;
  }
}

