import { Machine } from "@shared/schema";

interface MachineLanesProps {
  machines: Machine[];
  laneHeight: number;
  timeColumnWidth: number;
  totalWidth: number;
}

export function MachineLanes({ machines, laneHeight, timeColumnWidth, totalWidth }: MachineLanesProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 border-green-200";
      case "idle":
        return "bg-yellow-100 border-yellow-200";
      case "setup":
        return "bg-blue-100 border-blue-200";
      case "maintenance":
        return "bg-orange-100 border-orange-200";
      case "error":
        return "bg-red-100 border-red-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "setup":
        return "bg-blue-500";
      case "maintenance":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="relative">
      {machines.map((machine, index) => (
        <div key={machine.id} className="flex border-b border-gray-200">
          {/* Machine info column */}
          <div
            className={`flex-none border-r border-gray-200 p-3 ${getStatusColor(machine.status)}`}
            style={{ width: timeColumnWidth, height: laneHeight }}
          >
            <div className="flex items-center space-x-2 h-full">
              <div className={`w-3 h-3 rounded-full ${getStatusDot(machine.status)}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate" title={machine.name}>
                  {machine.name}
                </div>
                <div className="text-xs text-gray-500 truncate" title={machine.operation}>
                  {machine.operation}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline background */}
          <div
            className="relative bg-white border-r border-gray-100"
            style={{ width: totalWidth, height: laneHeight }}
          >
            {/* Grid lines for time intervals */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Vertical grid lines every 2 hours (assuming 40px per hour) */}
              {Array.from({ length: Math.floor(totalWidth / 80) }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-r border-gray-50"
                  style={{ left: i * 80 }}
                />
              ))}
            </div>

            {/* Drop zone indicator (shows during drag over) */}
            <div 
              className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 opacity-0 transition-opacity"
              data-testid={`drop-zone-${machine.id}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}