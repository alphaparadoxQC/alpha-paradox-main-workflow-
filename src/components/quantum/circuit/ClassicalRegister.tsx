import React from 'react';
import { CANVAS_PADDING } from './constants';

interface ClassicalRegisterProps {
  classicalBitCount: number;
  width: number;
}

export const ClassicalRegister: React.FC<ClassicalRegisterProps> = ({ classicalBitCount, width }) => {
  if (classicalBitCount === 0) return null;

  return (
    <div className="relative w-full" style={{ height: classicalBitCount * 30 + 20 }}>
      <svg width={width} height={classicalBitCount * 30 + 20} className="absolute inset-0 pointer-events-none">
        {Array.from({ length: classicalBitCount }).map((_, i) => {
          const y = 10 + i * 30;
          return (
            <g key={`classical-${i}`}>
              <line
                x1={CANVAS_PADDING}
                y1={y - 2}
                x2={width - CANVAS_PADDING}
                y2={y - 2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <line
                x1={CANVAS_PADDING}
                y1={y + 2}
                x2={width - CANVAS_PADDING}
                y2={y + 2}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <text
                x={CANVAS_PADDING - 25}
                y={y + 4}
                fill="hsl(199, 89%, 48%)"
                fontSize="14"
                fontFamily="monospace"
                fontWeight="bold"
              >
                c{i}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
