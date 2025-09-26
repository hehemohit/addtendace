import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, attendanceAPI } from '../services/api';
import { formatDate, formatTime, formatTime24, formatDateTime, formatDuration } from '../utils/helpers';
import SessionTimer from '../components/SessionTimer';
import SessionInfo from '../components/SessionInfo';
import UserSessionsList from '../components/UserSessionsList';
import RequestManagement from '../components/RequestManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <SessionTimer loginTime={loginTime} />
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (value === 'attendance') {
            fetchAttendanceRecords();
          }
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Today Overview</TabsTrigger>
            <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
            <TabsTrigger value="requests">Request Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SessionInfo loginTime={loginTime} user={user} />
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Today's Attendance Overview</CardTitle>
                    <CardDescription>Monitor employee attendance for today</CardDescription>
                  </div>
                  <Button onClick={fetchTodayOverview} variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Total Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayOverview.map((item) => (
                          <TableRow key={item.employee.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                    {item.employee.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{item.employee.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.employee.department} • {item.employee.position}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.attendance.clockIn ? formatTime24(item.attendance.clockIn) : 'Not logged in'}
                            </TableCell>
                            <TableCell>
                              {item.attendance.clockOut ? formatTime24(item.attendance.clockOut) : '-'}
                            </TableCell>
                            <TableCell>
                              {formatDuration(item.attendance.totalHours)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.attendance.status === 'present' ? 'default' : 'secondary'}>
                                {formatStatus(item.attendance.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.attendance.clockIn && (
                                <Button
                                  onClick={() => openEditAttendance(item)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Edit
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <UserSessionsList />
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>Manage your team members</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowCreateEmployee(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {employee.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{employee.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>
                            <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>View and manage attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Total Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell className="font-medium">{record.employee.name}</TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{formatTime24(record.clockIn)}</TableCell>
                            <TableCell>{record.clockOut ? formatTime24(record.clockOut) : '-'}</TableCell>
                            <TableCell>{formatDuration(record.totalHours)}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                                {formatStatus(record.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => openEditAttendance(record)}
                                variant="outline"
                                size="sm"
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <RequestManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Employee Modal */}
      <Dialog open={showCreateEmployee} onOpenChange={setShowCreateEmployee}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>
              Add a new employee to your team. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={employeeForm.password}
                onChange={(e) => setEmployeeForm({...employeeForm, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                type="text"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="text"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Create Employee
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateEmployee(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Modal */}
      <Dialog open={showEditAttendance} onOpenChange={setShowEditAttendance}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Attendance - {selectedAttendance?.employee?.name}
            </DialogTitle>
            <DialogDescription>
              Update attendance details for this employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAttendance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clockIn">Clock In</Label>
              <Input
                id="clockIn"
                type="datetime-local"
                value={attendanceForm.clockIn}
                onChange={(e) => setAttendanceForm({...attendanceForm, clockIn: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clockOut">Clock Out</Label>
              <Input
                id="clockOut"
                type="datetime-local"
                value={attendanceForm.clockOut}
                onChange={(e) => setAttendanceForm({...attendanceForm, clockOut: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows="3"
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                Update Attendance
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditAttendance(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
