import React, { useState, useEffect, useRef } from "react";
import { InputNumber, Button } from "antd";
import "./styles.css";

const worker = new Worker("./metronome/webworkers/metronomeWorker.js");

const Metronome = () => {
  const [bpm, setBpm] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const audioContextRef = useRef(null);

  const handleBpmChange = (value) => {
    setBpm(value);
    if (isActive) {
      worker.postMessage({ bpm: value });
    }
  };

  const handleTimerChange = (value) => {
    setTimerDuration(value);
    setTimeLeft(value * 60);
  };

  const playClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = "sine"; // Tipo de onda
    oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime); // Frecuencia en Hz
    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime); // Volumen

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.05); // Duración del click
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  useEffect(() => {
    worker.onmessage = (e) => {
      if (e.data === "tick") {
        playClick();
      }
    };

    return () => worker.terminate(); // Terminar el worker al desmontar el componente
  }, []);

  useEffect(() => {
    if (isActive) {
      worker.postMessage({ type: 'start', bpm: bpm });

    } else {
      worker.postMessage({ type: 'stop' });
    }
  }, [isActive, bpm]);

  useEffect(() => {
    let metronomeInterval;
    let timerInterval;

    const updateTimer = () => {
      if (timerDuration > 0 && timeLeft > 0) {
        setTimeLeft((prevTimeLeft) => prevTimeLeft - 1);
      } else if (timerDuration > 0 && timeLeft === 0) {
        // Detener el metrónomo cuando el temporizador llega a 0
        setIsActive(false);
      }
    };

    const updateElapsedTime = () => {
      setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
    };

    if (isActive && bpm > 0) {
      playClick();
      const metronomeIntervalDuration = (60 / bpm) * 1000;
      metronomeInterval = setInterval(playClick, metronomeIntervalDuration);

      // Actualiza elapsedTime cada segundo si el metrónomo está activo
      timerInterval = setInterval(() => {
        if (timerDuration > 0) {
          updateTimer();
        } else {
          updateElapsedTime();
        }
      }, 1000);
    } else {
      clearInterval(metronomeInterval);
      clearInterval(timerInterval);
    }

    return () => {
      clearInterval(metronomeInterval);
      clearInterval(timerInterval);
    };
  }, [isActive, bpm, timeLeft, timerDuration]);

  const increaseBpm = () => {
    setBpm((prevBpm) => Math.min(prevBpm + 5, 300));
  };

  const decreaseBpm = () => {
    setBpm((prevBpm) => Math.max(prevBpm - 5, 1));
  };

  return (
    <div className="metronome">
      <div className="metronome__bpms">
        <Button onClick={decreaseBpm}>-5 BPM</Button>

        <div className="bpms_selector">
          <InputNumber
            min={40}
            max={300}
            value={bpm}
            onChange={handleBpmChange}
            className="bpm"
          />
        </div>

        <Button onClick={increaseBpm}>+5 BPM</Button>
      </div>
      <div className="metronome__timer">
        <InputNumber
          min={0}
          max={60}
          value={timerDuration}
          onChange={handleTimerChange}
          placeholder="Duración del Temporizador (minutos)"
          addonAfter="min"
          className="timer__input"
          inputMode="decimnal"
        />

        {timerDuration > 0 ? (
          <div>Tiempo Restante: {formatTime(timeLeft)}</div>
        ) : (
          <div>Tiempo Transcurrido: {formatTime(elapsedTime)}</div>
        )}
      </div>

      <Button onClick={() => setIsActive(!isActive)} type="primary">
        {isActive ? "Parar" : "Iniciar"}
      </Button>
    </div>
  );
};

export default Metronome;
