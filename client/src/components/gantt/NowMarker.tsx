import { useMemo, useEffect, useState } from "react";

type ViewMode = "day" | "week" | "month";

interface TimeScale {
  start: Date;
  end: Date;
  getXPosition: (time: Date) => number;
}

interface NowMarkerProps {
  timeScale: TimeScale;
  viewMode: ViewMode;
  offsetLeft: number;
  height: number;
}

export function NowMarker({ timeScale, viewMode, offsetLeft, height }: NowMarkerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, viewMode === "day" ? 60000 : 300000); // Update every minute for day view, 5 minutes for others

    return () => clearInterval(interval);
  }, [viewMode]);

  const position = useMemo(() => {
    // Only show marker if current time is within the visible range
    if (currentTime < timeScale.start || currentTime > timeScale.end) {
      return null;
    }

    const x = timeScale.getXPosition(currentTime);
    return { x: x + offsetLeft };
  }, [currentTime, timeScale, offsetLeft]);

  if (!position) {
    return null;
  }

  return (
    <>
      {/* Vertical line */}
      <div
        className="absolute top-0 w-0.5 bg-red-500 z-30 pointer-events-none"
        style={{
          left: position.x,
          height: height,
        }}
      />
      
      {/* Time label */}
      <div
        className="absolute top-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-sm z-30 pointer-events-none transform -translate-x-1/2"
        style={{
          left: position.x,
          top: -6,
        }}
      >
        {currentTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}
      </div>

      {/* Arrow pointing down */}
      <div
        className="absolute w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500 z-30 pointer-events-none transform -translate-x-1/2"
        style={{
          left: position.x,
          top: 20,
        }}
      />
    </>
  );
}