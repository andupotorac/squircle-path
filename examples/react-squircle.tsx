import React, { useId } from "react";
import { getSquirclePath } from "squircle-path";

interface SquircleCardProps {
  width?: number;
  height?: number;
  radius?: number;
}

export function SquircleCard({
  width = 240,
  height = 120,
  radius = 32,
}: SquircleCardProps) {
  const clipPathId = useId();
  const path = getSquirclePath({ width, height, radius });

  return (
    <div
      style={{
        width,
        height,
        clipPath: `url(#${clipPathId})`,
        background: "linear-gradient(135deg, #2563eb, #9333ea)",
      }}
    >
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
