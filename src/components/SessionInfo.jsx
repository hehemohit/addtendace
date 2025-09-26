import React, { useState, useEffect } from 'react';
import { formatTime24, formatDate, formatDuration } from '../utils/helpers';

const SessionInfo = ({ loginTime, user, isContinuation = false }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!loginTime) return;

    const updateTime = () => {
      const now = new Date();
      const login = new Date(loginTime);
      const diffInMs = now - login;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      setElapsedTime(diffInHours);
      setCurrentTime(now);
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [loginTime]);

  if (!loginTime) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Session Status</h3>
            <p className="text-sm text-gray-500">No active session</p>
          </div>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Active Session</h3>
          <p className="text-xs text-gray-500">Logged in as {user?.name}</p>
          {isContinuation && (
            <p className="text-xs text-blue-600 font-medium">Session continued from previous login</p>
          )}
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Login Time</p>
          <p className="font-medium text-gray-900">{formatTime24(loginTime)}</p>
          <p className="text-xs text-gray-500">{formatDate(loginTime)}</p>
        </div>
        <div>
          <p className="text-gray-600">Session Duration</p>
          <p className="font-medium text-green-600">{formatDuration(elapsedTime)}</p>
          <p className="text-xs text-gray-500">Live</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Current Time: {formatTime24(currentTime)}</span>
          <span className="flex items-center">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></div>
            Live
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;
