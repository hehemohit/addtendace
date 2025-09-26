import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { formatDate, formatTime, formatTime24, formatDateTime, calculateHours, formatDuration } from '../utils/helpers';
import AttendanceCalendar from '../components/AttendanceCalendar';
import LiveStatusIndicator from '../components/LiveStatusIndicator';
import SessionTimer from '../components/SessionTimer';
import SessionInfo from '../components/SessionInfo';
import useRealTimeAttendance from '../hooks/useRealTimeAttendance';

const EmployeeDashboard = () => {
  const { user, logout, updateAttendance, loginTime } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time attendance hook
  const { 
    attendance: realTimeAttendance, 
    loading: realTimeLoading, 
    refreshAttendance 
  } = useRealTimeAttendance(user?.id, 30000); // Update every 30 seconds

  useEffect(() => {
    fetchCurrentAttendance();
    fetchAttendanceHistory();
  }, []);

  const fetchCurrentAttendance = async () => {
    try {
      const response = await attendanceAPI.getMyAttendance({ limit: 1 });
      if (response.data.attendance.length > 0) {
        const current = response.data.attendance[0];
        setAttendance(current);
        updateAttendance(current);
      }
    } catch (error) {
      console.error('Error fetching current attendance:', error);
    }
  };

  const fetchAttendanceHistory = async (page = 1) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getMyAttendance({ 
        page, 
        limit: 10 
      });
      setAttendanceHistory(response.data.attendance);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {user?.name}
              </h1>
              <p className="text-gray-600">{user?.department} • {user?.position}</p>
            </div>
            <div className="flex items-center space-x-4">
              <SessionTimer loginTime={loginTime} />
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Live Overview' },
              { id: 'calendar', name: 'Attendance Calendar' },
              { id: 'history', name: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Live Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SessionInfo loginTime={loginTime} user={user} />
            <LiveStatusIndicator 
              attendance={realTimeAttendance} 
              loading={realTimeLoading} 
            />
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Today's Summary</h2>
                <button
                  onClick={refreshAttendance}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
              {realTimeAttendance ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Clock In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatTime24(realTimeAttendance.clockIn)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(realTimeAttendance.clockIn)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Clock Out</p>
                    <p className="text-2xl font-bold text-red-600">
                      {realTimeAttendance.clockOut ? formatTime24(realTimeAttendance.clockOut) : 'Not logged out'}
                    </p>
                    {realTimeAttendance.clockOut && (
                      <p className="text-xs text-gray-500">
                        {formatDate(realTimeAttendance.clockOut)}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatDuration(realTimeAttendance.totalHours)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(realTimeAttendance.status)}`}>
                      {formatStatus(realTimeAttendance.status)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance record for today</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <AttendanceCalendar userId={user?.id} />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : attendanceHistory.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clock In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clock Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceHistory.map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime24(record.clockIn)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clockOut ? formatTime24(record.clockOut) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDuration(record.totalHours)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {formatStatus(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchAttendanceHistory(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => fetchAttendanceHistory(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
