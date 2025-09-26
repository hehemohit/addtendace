import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, attendanceAPI } from '../services/api';
import { formatDate, formatTime, formatTime24, formatDateTime, formatDuration } from '../utils/helpers';
import SessionTimer from '../components/SessionTimer';
import SessionInfo from '../components/SessionInfo';
import UserSessionsList from '../components/UserSessionsList';

const AdminDashboard = () => {
  const { user, logout, loginTime } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [todayOverview, setTodayOverview] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [showEditAttendance, setShowEditAttendance] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Create employee form
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    position: '',
  });

  // Edit attendance form
  const [attendanceForm, setAttendanceForm] = useState({
    clockIn: '',
    clockOut: '',
    status: 'present',
    notes: '',
  });

  useEffect(() => {
    fetchTodayOverview();
    fetchEmployees();
  }, []);

  const fetchTodayOverview = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getTodayOverview();
      setTodayOverview(response.data);
    } catch (error) {
      console.error('Error fetching today overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getAll({ role: 'employee' });
      setEmployees(response.data.users);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendanceRecords = async (page = 1) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAll({ page, limit: 20 });
      setAttendanceRecords(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(employeeForm);
      setEmployeeForm({
        name: '',
        email: '',
        password: '',
        department: '',
        position: '',
      });
      setShowCreateEmployee(false);
      fetchEmployees();
      alert('Employee created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating employee');
    }
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    try {
      await attendanceAPI.update(selectedAttendance._id, attendanceForm);
      setShowEditAttendance(false);
      setSelectedAttendance(null);
      fetchTodayOverview();
      fetchAttendanceRecords();
      alert('Attendance updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating attendance');
    }
  };

  const openEditAttendance = (attendance) => {
    setSelectedAttendance(attendance);
    setAttendanceForm({
      clockIn: attendance.clockIn ? new Date(attendance.clockIn).toISOString().slice(0, 16) : '',
      clockOut: attendance.clockOut ? new Date(attendance.clockOut).toISOString().slice(0, 16) : '',
      status: attendance.status,
      notes: attendance.notes || '',
    });
    setShowEditAttendance(true);
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user?.name}</p>
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
              { id: 'overview', name: 'Today Overview' },
              { id: 'sessions', name: 'Live Sessions' },
              { id: 'employees', name: 'Employee Management' },
              { id: 'attendance', name: 'Attendance Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'attendance') {
                    fetchAttendanceRecords();
                  }
                }}
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

        {/* Today Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SessionInfo loginTime={loginTime} user={user} />
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Today's Attendance Overview</h2>
              <button
                onClick={fetchTodayOverview}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {todayOverview.map((item) => (
                    <li key={item.employee.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {item.employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.employee.department} • {item.employee.position}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-900">
                            {item.attendance.clockIn ? formatTime24(item.attendance.clockIn) : 'Not logged in'}
                          </div>
                          <div className="text-sm text-gray-900">
                            {item.attendance.clockOut ? formatTime24(item.attendance.clockOut) : '-'}
                          </div>
                          <div className="text-sm text-gray-900">
                            {formatDuration(item.attendance.totalHours)}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.attendance.status)}`}>
                            {formatStatus(item.attendance.status)}
                          </span>
                          {item.attendance.clockIn && (
                            <button
                              onClick={() => openEditAttendance(item)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Live Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <UserSessionsList />
          </div>
        )}

        {/* Employee Management Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
              <button
                onClick={() => setShowCreateEmployee(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Employee
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {employees.map((employee) => (
                  <li key={employee._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.department} • {employee.position}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Attendance Records Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.employee.name}
                          </td>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEditAttendance(record)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {showCreateEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Employee</h3>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({...employeeForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateEmployee(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditAttendance && selectedAttendance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Attendance - {selectedAttendance.employee.name}
              </h3>
              <form onSubmit={handleEditAttendance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clock In</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={attendanceForm.clockIn}
                    onChange={(e) => setAttendanceForm({...attendanceForm, clockIn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clock Out</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={attendanceForm.clockOut}
                    onChange={(e) => setAttendanceForm({...attendanceForm, clockOut: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                    value={attendanceForm.notes}
                    onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Update Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditAttendance(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
