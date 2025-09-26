import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { formatTime24, formatDate, formatDuration, formatDurationWithSeconds } from '../utils/helpers';

const UserSessionsList = () => {
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getActiveSessions();
      setUserSessions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user sessions:', err);
      setError('Failed to load user sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSessions();
    
    // Refresh data every 30 seconds
    const dataInterval = setInterval(fetchUserSessions, 30000);
    
    // Update current time every second for live session duration
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half-day':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'half-day':
        return 'Half Day';
      default:
        return 'Unknown';
    }
  };

  const calculateSessionDuration = (clockIn) => {
    if (!clockIn) return '0h 0m 0s';
    const login = new Date(clockIn);
    const diffInMs = currentTime - login;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return formatDurationWithSeconds(diffInHours);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading user sessions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserSessions}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Live User Sessions</h2>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-gray-600">Live Updates</span>
            <button
              onClick={fetchUserSessions}
              className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours Today
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userSessions.map((userSession) => (
              <tr key={userSession.employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {userSession.employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {userSession.employee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userSession.employee.department} • {userSession.employee.position}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      userSession.session.isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(userSession.session.status)}`}>
                      {formatStatus(userSession.session.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {userSession.session.clockIn ? (
                    <div>
                      <div className="font-medium">{formatTime24(userSession.session.clockIn)}</div>
                      <div className="text-xs text-gray-500">{formatDate(userSession.session.clockIn)}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not logged in</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {userSession.session.isLoggedIn ? (
                    <div className="flex items-center">
                      <span className="font-medium text-green-600">
                        {calculateSessionDuration(userSession.session.clockIn)}
                      </span>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-2"></div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(userSession.session.totalHours)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">{userSessions.filter(s => s.session.isLoggedIn).length}</span> active sessions
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span>Auto-refresh every 30 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSessionsList;
