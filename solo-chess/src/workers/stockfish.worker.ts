// src/workers/stockfish.worker.ts

// Stockfish 엔진 인스턴스
let stockfish: Worker | null = null;

// 메시지 핸들러
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      initEngine();
      break;
    case 'position':
      setPosition(payload.fen, payload.moves);
      break;
    case 'go':
      calculateBestMove(payload);
      break;
    case 'stop':
      stopCalculation();
      break;
    case 'quit':
      quitEngine();
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

// 엔진 초기화
function initEngine() {
  try {
    const wasmSupported =
      typeof WebAssembly === 'object' &&
      WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
    const workerPath = wasmSupported ? '/stockfish/stockfish.wasm.js' : '/stockfish/stockfish.js';
    stockfish = new Worker(workerPath);

    stockfish.onmessage = (ev: MessageEvent) => {
      handleEngineOutput(ev.data);
    };

    stockfish.onerror = (ev: ErrorEvent) => {
      self.postMessage({
        type: 'error',
        payload: { message: 'Stockfish error: ' + ev.message },
      });
    };

    stockfish.postMessage('uci');
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: { message: 'Failed to initialize Stockfish: ' + String(error) },
    });
  }
}

// 포지션 설정
function setPosition(fen: string, moves?: string[]) {
  if (!stockfish) return;

  let positionCommand = `position fen ${fen}`;
  if (moves && moves.length > 0) {
    positionCommand += ` moves ${moves.join(' ')}`;
  }
  stockfish.postMessage(positionCommand);
}

// 최선의 수 계산
function calculateBestMove(options: {
  depth?: number;
  movetime?: number;
  nodes?: number;
}) {
  if (!stockfish) return;

  let goCommand = 'go';
  if (options.depth) goCommand += ` depth ${options.depth}`;
  if (options.movetime) goCommand += ` movetime ${options.movetime}`;
  if (options.nodes) goCommand += ` nodes ${options.nodes}`;
  if (!options.depth && !options.movetime && !options.nodes) {
    goCommand += ' depth 10';
  }
  stockfish.postMessage(goCommand);
}

// 계산 중지
function stopCalculation() {
  if (!stockfish) return;
  stockfish.postMessage('stop');
}

// 엔진 종료
function quitEngine() {
  if (!stockfish) return;
  stockfish.postMessage('quit');
  stockfish.terminate();
  stockfish = null;
}

// 엔진 출력 처리
function handleEngineOutput(output: string) {
  if (output.startsWith('bestmove')) {
    const parts = output.split(' ');
    const bestMove = parts[1];
    const ponderMove = parts[3] || null;
    self.postMessage({
      type: 'bestmove',
      payload: { bestMove, ponderMove },
    });
  } else if (output.startsWith('info')) {
    const info = parseInfoString(output);
    self.postMessage({ type: 'info', payload: info });
  } else if (output === 'uciok') {
    if (stockfish) stockfish.postMessage('isready');
  } else if (output === 'readyok') {
    self.postMessage({ type: 'initialized' });
  }
}

// info 문자열 파싱
function parseInfoString(info: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const parts = info.split(' ');

  for (let i = 1; i < parts.length; i++) {
    const key = parts[i];

    switch (key) {
      case 'depth':
        result.depth = parseInt(parts[++i], 10);
        break;
      case 'seldepth':
        result.seldepth = parseInt(parts[++i], 10);
        break;
      case 'score': {
        const scoreType = parts[++i];
        const scoreValue = parseInt(parts[++i], 10);
        result.score = { type: scoreType, value: scoreValue };
        break;
      }
      case 'nodes':
        result.nodes = parseInt(parts[++i], 10);
        break;
      case 'nps':
        result.nps = parseInt(parts[++i], 10);
        break;
      case 'time':
        result.time = parseInt(parts[++i], 10);
        break;
      case 'pv':
        result.pv = parts.slice(i + 1);
        i = parts.length;
        break;
    }
  }
  return result;
}

export {};
