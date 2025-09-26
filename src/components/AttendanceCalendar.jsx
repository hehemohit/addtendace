import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { formatDate, formatTime, formatTime24, formatDuration } from '../utils/helpers';

const AttendanceCalendar = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate, userId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await attendanceAPI.getMyAttendance({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 100
      });

      const data = {};
      response.data.attendance.forEach(record => {
        const date = new Date(record.date).toDateString();
        data[date] = record;
      });
      
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAttendanceStatus = (date) => {
    if (!date) return null;
    const dateString = date.toDateString();
    return attendanceData[dateString] || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'half-day':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return '✓';
      case 'absent':
        return '✗';
      case 'late':
        return '⚠';
      case 'half-day':
        return '◐';
      default:
        return '○';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Calendar</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-medium text-gray-900 min-w-[150px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const attendance = getAttendanceStatus(day);
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && day && day.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={index}
                  className={`
                    relative p-2 h-16 border rounded-md cursor-pointer transition-all
                    ${day ? 'hover:bg-gray-50' : ''}
                    ${isToday ? 'ring-2 ring-indigo-500' : ''}
                    ${isSelected ? 'bg-indigo-50' : ''}
                    ${attendance ? getStatusColor(attendance.status) : 'bg-white border-gray-200'}
                  `}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium">
                        {day.getDate()}
                      </div>
                      {attendance && (
                        <div className="absolute bottom-1 right-1 text-xs">
                          {getStatusIcon(attendance.status)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2 flex items-center justify-center text-xs">✓</div>
              <span>Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2 flex items-center justify-center text-xs">✗</div>
              <span>Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2 flex items-center justify-center text-xs">⚠</div>
              <span>Late</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2 flex items-center justify-center text-xs">◐</div>
              <span>Half Day</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2 flex items-center justify-center text-xs">○</div>
              <span>No Record</span>
            </div>
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {formatDate(selectedDate)}
              </h4>
              {attendanceData[selectedDate.toDateString()] ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clock In:</span>
                    <span className="font-medium">
                      {formatTime24(attendanceData[selectedDate.toDateString()].clockIn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clock Out:</span>
                    <span className="font-medium">
                      {attendanceData[selectedDate.toDateString()].clockOut 
                        ? formatTime24(attendanceData[selectedDate.toDateString()].clockOut)
                        : 'Not logged out'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">
                      {formatDuration(attendanceData[selectedDate.toDateString()].totalHours)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendanceData[selectedDate.toDateString()].status)}`}>
                      {attendanceData[selectedDate.toDateString()].status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No attendance record for this date</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceCalendar;
