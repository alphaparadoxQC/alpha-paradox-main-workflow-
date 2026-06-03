import React from 'react';
import { motion } from 'framer-motion';
import { ROW_HEIGHT, CANVAS_PADDING } from './constants';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';

interface QubitRowProps {
  index: number;
  width: number;
}

export const QubitRow: React.FC<QubitRowProps> = ({ index, width }) => {
  const {
    selectionVibeStep,
    selectionVibeControlQubit,
    selectControlQubit,
    selectTargetQubit,
    simulationResult
  } = useQuantumCircuitStore();

  const isVibeActive = selectionVibeStep !== 'idle';
  const isControlSelected = selectionVibeStep === 'selectTarget' && selectionVibeControlQubit === index;
  const isValidTarget = selectionVibeStep === 'selectTarget' && selectionVibeControlQubit !== index;
  const isClickable = selectionVibeStep === 'selectControl' || isValidTarget;

  const handleClick = () => {
    if (selectionVibeStep === 'selectControl') {
      selectControlQubit(index);
    } else if (selectionVibeStep === 'selectTarget' && selectionVibeControlQubit !== index) {
      selectTargetQubit(index);
    }
  };

  // State visualization
  const vec = simulationResult?.blochVectors?.[index] || { x: 0, y: 0, z: 1 };
  const prob = (1 - vec.z) / 2;
  const phaseAngle = Math.atan2(vec.y, vec.x);
  const r = 16;
  const endX = width - CANVAS_PADDING;
  const lineY = ROW_HEIGHT / 2;

  return (
    <div
      className={`qubit-row absolute left-0 right-0 hover:bg-white/5 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
      style={{
        height: ROW_HEIGHT,
        top: index * ROW_HEIGHT + CANVAS_PADDING, // Added padding at top
      }}
      data-qubit={index}
      onClick={handleClick}
    >
      <svg width={width} height={ROW_HEIGHT} className="absolute inset-0 pointer-events-none">
        <defs>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="qubit-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0" />
            <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.6" />
            <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line glow */}
        <line
          x1={CANVAS_PADDING}
          y1={lineY}
          x2={endX - 16}
          y2={lineY}
          stroke="url(#qubit-line-gradient)"
          strokeWidth="4"
          filter="url(#glow-cyan)"
        />
        
        {/* Main line */}
        <line
          x1={CANVAS_PADDING}
          y1={lineY}
          x2={endX - 16}
          y2={lineY}
          stroke="hsl(199, 89%, 48%)"
          strokeWidth="2"
          strokeOpacity="0.6"
        />
        
        {/* Qubit label */}
        <text
          x={CANVAS_PADDING - 25}
          y={lineY + 5}
          fill="hsl(199, 89%, 48%)"
          fontSize="14"
          fontFamily="monospace"
          fontWeight="bold"
        >
          q{index}
        </text>
        
        {/* Initial state */}
        <text
          x={CANVAS_PADDING + 10}
          y={lineY + 5}
          fill="hsl(var(--muted-foreground))"
          fontSize="12"
          fontFamily="monospace"
        >
          |0⟩
        </text>

        {/* Selection Vibe highlight on qubit line */}
        {isVibeActive && isClickable && (
          <motion.rect
            x={CANVAS_PADDING - 30}
            y={lineY - 20}
            width={width - CANVAS_PADDING * 2 + 60}
            height={40}
            rx="6"
            fill={selectionVibeStep === 'selectControl' ? 'hsl(185, 100%, 50%)' : 'hsl(265, 100%, 65%)'}
            fillOpacity="0.08"
            animate={{ fillOpacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {/* Control qubit indicator when selected */}
        {isControlSelected && (
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <circle
              cx={CANVAS_PADDING - 40}
              cy={lineY}
              r="8"
              fill="hsl(185, 100%, 50%)"
            />
            <text
              x={CANVAS_PADDING - 40}
              y={lineY + 4}
              fill="hsl(var(--background))"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              ●
            </text>
          </motion.g>
        )}

        {/* End-of-line Phase Disk */}
        <g>
          <circle cx={endX} cy={lineY} r={r} fill="#1e293b" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.9" />
          <clipPath id={`clip-end-${index}`}>
            <circle cx={endX} cy={lineY} r={r} />
          </clipPath>
          <rect
            x={endX - r}
            y={lineY + r - prob * 2 * r}
            width={2 * r}
            height={prob * 2 * r}
            fill="#0ea5e9"
            clipPath={`url(#clip-end-${index})`}
            opacity={0.9}
          />
          <circle cx={endX} cy={lineY} r={r} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.8" />
          <line
            x1={endX}
            y1={lineY}
            x2={endX + r * Math.cos(phaseAngle)}
            y2={lineY - r * Math.sin(phaseAngle)}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
