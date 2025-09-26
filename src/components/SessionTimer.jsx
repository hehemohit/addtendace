import React, { useState, useEffect } from 'react';
import { formatDuration } from '../utils/helpers';

const SessionTimer = ({ loginTime, className = "" }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!loginTime) return;

    const updateTimer = () => {
      const now = new Date();
      const login = new Date(loginTime);
      const diffInMs = now - login;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      setElapsedTime(diffInHours);
    };

    // Update immediately
    updateTimer();

    // Update every second for real-time display
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [loginTime]);

  if (!loginTime) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
        No active session
      </div>
    );
  }

  return (
    <div className={`flex items-center text-sm ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
      <span className="text-gray-700">
        Session: <span className="font-medium text-green-600">{formatDuration(elapsedTime)}</span>
      </span>
    </div>
  );
};

export default SessionTimer;
