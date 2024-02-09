/* eslint-disable no-restricted-globals */
self.postMessage("Worker listo");

interface WorkerMessage {
  type: 'start' | 'stop';
  bpm?: number;
}

let intervalId: number | undefined;

const tick = () => {
  postMessage("tick");
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const data = e.data;


  if (data.type === "start" && data.bpm) {
    const interval = (60 / data.bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval) as unknown as number;
  } else if (data.type === "stop") {
    clearInterval(intervalId);
  } else if (data.bpm) {
    const interval = (60 / data.bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval) as unknown as number;
  }
};

export {}