"use client";

import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Diamond } from "lucide-react";
import Image from "next/image";

const REWARDS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000];
const WEIGHTS = [125, 125, 125, 125, 120, 110, 40, 40, 40, 40, 30, 10];

const COLORS = [
  "hsl(262, 83%, 58%)",
  "hsl(224, 71%, 60%)",
  "hsl(186, 91%, 56%)",
  "hsl(142, 76%, 57%)",
  "hsl(47, 96%, 56%)",
  "hsl(21, 90%, 56%)",
  "hsl(340, 82%, 62%)",
  "hsl(291, 84%, 61%)",
];

const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: NodeJS.Timeout = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults, particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults, particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

export default function SpinWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setReward(null);

    const rand = Math.random() * 1000;
    let sum = 0;
    let winnerIndex = 0;

    for (let i = 0; i < WEIGHTS.length; i++) {
      sum += WEIGHTS[i];
      if (rand <= sum) {
        winnerIndex = i;
        break;
      }
    }

    const segmentAngle = 360 / REWARDS.length;

    // Add jitter within the slice (-10 to +10 degrees)
    const jitter = (Math.random() - 0.5) * (segmentAngle - 6);

    const sliceCenterAngle = (winnerIndex * segmentAngle) + (segmentAngle / 2);
    let desiredStopAngle = 270 - sliceCenterAngle + jitter;
    desiredStopAngle = ((desiredStopAngle % 360) + 360) % 360;

    const minRevolutions = 6;
    const additionalRandomRevolutions = Math.floor(Math.random() * 4);
    const totalRevolutions = minRevolutions + additionalRandomRevolutions;

    const currentNormalizedRotation = rotation % 360;
    let deltaRotation = desiredStopAngle - currentNormalizedRotation;

    if (deltaRotation < 0) {
      deltaRotation += 360;
    }

    const newRotation = rotation + (totalRevolutions * 360) + deltaRotation;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setReward(REWARDS[winnerIndex]);
      triggerConfetti();
    }, 5000);
  }, [isSpinning, rotation]);

  const createWheelSlices = () => {
    const segmentAngle = 360 / REWARDS.length;
    const radius = 150;

    return (
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 300">
        {REWARDS.map((item, index) => {
          const startAngle = index * segmentAngle;
          const endAngle = (index + 1) * segmentAngle;

          const x1 = 150 + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 150 + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 150 + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 150 + radius * Math.sin((endAngle * Math.PI) / 180);

          const largeArcFlag = segmentAngle > 180 ? 1 : 0;

          const pathData = [
            `M 150 150`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`,
          ].join(" ");

          const textAngleRad = (index * segmentAngle + segmentAngle / 2) * (Math.PI / 180);

          // Adjusted text radius to place text nicely inside the slice
          const textRadius = radius * 0.65;
          const textX = 150 + textRadius * Math.cos(textAngleRad);
          const textY = 150 + textRadius * Math.sin(textAngleRad);

          const color = COLORS[index % COLORS.length];

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white font-bold text-sm"
                transform={`rotate(${(textAngleRad * 180) / Math.PI + 180}, ${textX}, ${textY})`}
              >
                {item}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-slate-900 font-sans p-6">

      {/* Decorative Header */}
      <div className="text-center mb-12 space-y-4 z-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm">
          Community Hero Reward Wheel
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">
          Test your luck to win exclusive diamond packs. Spin the wheel to claim your reward!
        </p>
      </div>

      <div className="relative flex flex-col items-center z-10 mb-8">

        {/* Pointer - fixed at the top */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent border-t-[#1e293b] drop-shadow-md"></div>
        </div>

        {/* Wheel Container */}
        <div className="relative rounded-full p-2 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100">
          <div className="relative w-[340px] h-[340px] md:w-[500px] md:h-[500px] rounded-full overflow-hidden shadow-inner border-4 border-slate-50">

            {/* The Rotating Wheel */}
            <div
              className="w-full h-full rounded-full bg-slate-50"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              }}
            >
              {createWheelSlices()}
            </div>

            {/* Stationary Center Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-30 md:h-30 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)] border-2 border-slate-100 flex items-center justify-center z-20">
              <Image src={"/comunitty_hero.jpeg"} alt="Community Hero" width={500} height={500} className="rounded-full"></Image>
            </div>

          </div>
        </div>

        {/* Manual Spin Button */}
        <button
          onClick={spin}
          disabled={isSpinning}
          className={`mt-10 px-10 py-4 bg-black text-white rounded-xl font-black text-xl tracking-wider shadow-xl transition-all duration-300 transform ${isSpinning
            ? 'opacity-60 cursor-not-allowed scale-95 shadow-none'
            : 'hover:bg-slate-800 hover:shadow-2xl active:scale-95'
            }`}
        >
          {isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
        </button>
      </div>

      {/* Result Area */}
      <div className={`mt-2 h-24 text-center transition-all duration-700 ease-out transform ${reward && !isSpinning ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
        {reward && (
          <div className="bg-white px-8 py-4 rounded-2xl shadow-lg border border-slate-100">
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mb-1">Congratulations!</p>
            <div className="flex items-center justify-center gap-3 text-4xl font-black text-slate-900">
              <Diamond className="text-blue-500 w-10 h-10 animate-pulse" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {reward} Diamonds
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
