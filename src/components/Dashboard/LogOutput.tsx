import React from 'react';
import { parseLogLine, getLogLevelColor, getLogLevelIcon, formatLogMessage } from '../../utils/logFormatter';

interface Props {
  logs: string[];
  maxHeight?: string;
  className?: string;
}

const LogOutput: React.FC<Props> = ({ logs, maxHeight = '400px', className = '' }) => {
  return (
    <div 
      className={`bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <div className="space-y-2">
        {logs.map((line, index) => {
          const parsedLog = parseLogLine(line);
          
          if (!parsedLog) {
            return null; // Skip DEBUG logs and unparseable lines
          }

          const { level, message } = parsedLog;
          const levelColor = getLogLevelColor(level);
          const icon = getLogLevelIcon(level);
          const formattedMessage = formatLogMessage(message);

          return (
            <div key={index} className="flex items-start gap-2 group hover:bg-gray-800/50 p-2 rounded">
              <span className={`${levelColor} flex items-center gap-1 whitespace-nowrap`}>
                {icon}
                <span className="font-semibold">{level}</span>
              </span>

              <span 
                className="text-gray-300 break-all"
                dangerouslySetInnerHTML={{ __html: formattedMessage }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogOutput;