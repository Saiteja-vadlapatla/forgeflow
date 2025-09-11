import { format } from "date-fns";

type ViewMode = "day" | "week" | "month";

interface TimeScale {
  start: Date;
  end: Date;
  pixelsPerHour: number;
  intervals: Date[];
  totalWidth: number;
  getXPosition: (time: Date) => number;
  getTimeFromX: (x: number) => Date;
}

interface TimelineHeaderProps {
  timeScale: TimeScale;
  viewMode: ViewMode;
  className?: string;
  style?: React.CSSProperties;
}

export function TimelineHeader({ timeScale, viewMode, className, style }: TimelineHeaderProps) {
  const formatInterval = (date: Date, index: number) => {
    switch (viewMode) {
      case "day":
        return format(date, "HH:mm");
      case "week":
        return format(date, index === 0 ? "EEE MMM d" : "EEE d");
      case "month":
        return format(date, index % 5 === 0 ? "MMM d" : "d");
      default:
        return format(date, "MMM d");
    }
  };

  const getIntervalWidth = (index: number) => {
    if (index === timeScale.intervals.length - 1) {
      return timeScale.totalWidth - timeScale.getXPosition(timeScale.intervals[index]);
    }
    return timeScale.getXPosition(timeScale.intervals[index + 1]) - timeScale.getXPosition(timeScale.intervals[index]);
  };

  return (
    <div className={className} style={style}>
      <div className="relative h-full">
        {/* Major time intervals */}
        {timeScale.intervals.map((interval, index) => {
          const x = timeScale.getXPosition(interval);
          const width = getIntervalWidth(index);
          
          return (
            <div
              key={interval.toISOString()}
              className="absolute h-full border-r border-gray-200 flex flex-col"
              style={{ left: x, width }}
            >
              {/* Main label */}
              <div className="flex-1 flex items-center justify-center px-2 text-sm font-medium text-gray-700">
                {formatInterval(interval, index)}
              </div>
              
              {/* Sub-divisions for day view (hours) */}
              {viewMode === "day" && (
                <div className="h-6 border-t border-gray-100 relative">
                  {/* Hour subdivisions */}
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-r border-gray-100"
                      style={{ left: `${(i + 1) * 25}%` }}
                    />
                  ))}
                </div>
              )}
              
              {/* Sub-divisions for week view (days split into hours) */}
              {viewMode === "week" && (
                <div className="h-6 border-t border-gray-100 relative">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full border-r border-gray-100 text-xs text-gray-500 flex items-center justify-center"
                      style={{ 
                        left: `${i * 12.5}%`, 
                        width: "12.5%",
                      }}
                    >
                      {i * 3}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Now indicator line in header */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
          style={{ left: timeScale.getXPosition(new Date()) }}
        />
      </div>
    </div>
  );
}