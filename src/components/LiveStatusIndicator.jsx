import React from 'react';
import { formatTime, formatTime24, formatDate, formatDuration } from '../utils/helpers';

const LiveStatusIndicator = ({ attendance, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading status...</span>
        </div>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">○</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Today</h3>
          <p className="text-gray-500">You haven't logged in today</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = attendance.clockIn && !attendance.clockOut;
  const statusColor = isLoggedIn ? 'text-green-600' : 'text-gray-600';
  const statusBg = isLoggedIn ? 'bg-green-100' : 'bg-gray-100';
  const statusText = isLoggedIn ? 'Currently Logged In' : 'Logged Out';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Status</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} mr-2`}></div>
          <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatTime24(attendance.clockIn)}
          </div>
          <div className="text-sm text-gray-600">Clock In</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(attendance.clockIn)}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {attendance.clockOut ? formatTime24(attendance.clockOut) : '--:--'}
          </div>
          <div className="text-sm text-gray-600">Clock Out</div>
          {attendance.clockOut && (
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(attendance.clockOut)}
            </div>
          )}
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatDuration(attendance.totalHours)}
          </div>
          <div className="text-sm text-gray-600">Total Hours</div>
          <div className="text-xs text-gray-500 mt-1">Today</div>
        </div>
      </div>

      {isLoggedIn && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-green-800">
              You are currently logged in. Your attendance is being tracked in real-time.
            </span>
          </div>
        </div>
      )}

      {attendance.notes && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> {attendance.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStatusIndicator;
