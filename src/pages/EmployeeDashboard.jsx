import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../services/api';
import { formatDate, formatTime, formatTime24, formatDateTime, calculateHours, formatDuration } from '../utils/helpers';
import AttendanceCalendar from '../components/AttendanceCalendar';
import LiveStatusIndicator from '../components/LiveStatusIndicator';
import SessionTimer from '../components/SessionTimer';
import SessionInfo from '../components/SessionInfo';
import RequestForm from '../components/RequestForm';
import MyRequests from '../components/MyRequests';
import useRealTimeAttendance from '../hooks/useRealTimeAttendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const EmployeeDashboard = () => {
  const { user, logout, updateAttendance, loginTime } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestForm, setShowRequestForm] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome, {user?.name}
                </h1>
                <p className="text-muted-foreground">{user?.department} • {user?.position}</p>
              </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Live Overview</TabsTrigger>
            <TabsTrigger value="calendar">Attendance Calendar</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SessionInfo loginTime={loginTime} user={user} />
            <LiveStatusIndicator 
              attendance={realTimeAttendance} 
              loading={realTimeLoading} 
            />
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Summary</CardTitle>
                    <CardDescription>Your attendance overview for today</CardDescription>
                  </div>
                  <Button
                    onClick={refreshAttendance}
                    variant="outline"
                    size="sm"
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {realTimeAttendance ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-2">Clock In</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatTime24(realTimeAttendance.clockIn)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(realTimeAttendance.clockIn)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-2">Clock Out</p>
                        <p className="text-2xl font-bold text-red-600">
                          {realTimeAttendance.clockOut ? formatTime24(realTimeAttendance.clockOut) : 'Not logged out'}
                        </p>
                        {realTimeAttendance.clockOut && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(realTimeAttendance.clockOut)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-2">Total Hours</p>
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          {formatDuration(realTimeAttendance.totalHours)}
                        </p>
                        <Badge variant={realTimeAttendance.status === 'present' ? 'default' : 'secondary'}>
                          {formatStatus(realTimeAttendance.status)}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No attendance record for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <AttendanceCalendar userId={user?.id} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Your complete attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : attendanceHistory.length > 0 ? (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Clock Out</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceHistory.map((record) => (
                            <TableRow key={record._id}>
                              <TableCell className="font-medium">
                                {formatDate(record.date)}
                              </TableCell>
                              <TableCell>{formatTime24(record.clockIn)}</TableCell>
                              <TableCell>
                                {record.clockOut ? formatTime24(record.clockOut) : '-'}
                              </TableCell>
                              <TableCell>{formatDuration(record.totalHours)}</TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                                  {formatStatus(record.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => fetchAttendanceHistory(currentPage - 1)}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={() => fetchAttendanceHistory(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No attendance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Request Management</h2>
                <p className="text-muted-foreground">Submit requests and track their status</p>
              </div>
              <Button onClick={() => setShowRequestForm(true)}>
                Create New Request
              </Button>
            </div>
            <MyRequests />
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Form Modal */}
      <RequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSuccess={() => {
          // Refresh requests if needed
          setShowRequestForm(false);
        }}
      />
    </div>
  );
};

export default EmployeeDashboard;
