let intervalId;

const tick = () => {
  postMessage("tick");
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e) => {
  if (e.data.type === "start") {
    const bpm = e.data.bpm;
    const interval = (60 / bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval);
  } else if (e.data.type === "stop") {
    clearInterval(intervalId);
  } else if (e.data.type === "bpmChange") {
    const bpm = e.data.bpm;
    const interval = (60 / bpm) * 1000;
    clearInterval(intervalId);
    intervalId = setInterval(tick, interval);
  }
};
