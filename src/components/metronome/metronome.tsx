import React, { useState, useEffect, useRef } from "react";
import { InputNumber, Button } from "antd";
import "./styles.css";
import Click from './audio/click.mp3';

const worker: Worker = new Worker(new URL('../../workers/metronomeWorker.ts', import.meta.url));

worker.onmessage = (event) => {
  console.log(event.data); // Debería mostrar "Worker listo" en la consola
};

const Metronome: React.FC = () => {
  const [bpm, setBpm] = useState<number>(60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const soundRef = useRef<HTMLAudioElement>(new Audio(Click));

  const handleBpmChange = (value: number | null) => {
    const newValue = value === null ? 60 : value;
    setBpm(newValue);
    if (isActive) {
      worker.postMessage({ bpm: newValue });
    }
  };

  const handleTimerChange = (value: number | null) => {
    const newValue = value === null ? 0 : value;
    setTimerDuration(newValue);
    setTimeLeft(newValue * 60);
  };

  const playClick = () => {
    if (soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch((e) => console.error("Error al reproducir el sonido: ", e));
    }
  };

  const formatTime = (timeInSeconds: number): string => {
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
    let metronomeInterval: number | undefined;
    let timerInterval: number | undefined;

    const updateTimer = () => {
      if (timerDuration > 0 && timeLeft > 0) {
        setTimeLeft((prevTimeLeft) => prevTimeLeft - 1);
      } else if (timerDuration > 0 && timeLeft === 0) {
        setIsActive(false);
      }
    };

    const updateElapsedTime = () => {
      setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
    };

    if (isActive && bpm > 0) {
      
      const metronomeIntervalDuration = (60 / bpm) * 1000;
      metronomeInterval = window.setInterval(playClick, metronomeIntervalDuration);

      // Actualiza elapsedTime cada segundo si el metrónomo está activo
      timerInterval = window.setInterval(() => {
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
          inputMode="numeric"
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
