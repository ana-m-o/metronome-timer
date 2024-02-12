let intervalId;

const tick = () => {
  postMessage("tick");
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e) => {
  if (e.data === "start") {
    const bpm = e.data.bpm;
    const interval = (60 / bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval);
  } else if (e.data === "stop") {
    clearInterval(intervalId);
  } else if (e.data.bpm) {
    const interval = (60 / e.data.bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval);
  }
};
