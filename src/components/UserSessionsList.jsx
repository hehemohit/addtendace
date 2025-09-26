import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { formatTime24, formatDate, formatDuration, formatDurationWithSeconds } from '../utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading user sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchUserSessions} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live User Sessions
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of employee sessions
            </CardDescription>
          </div>
          <Button onClick={fetchUserSessions} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Session Duration</TableHead>
                <TableHead>Total Hours Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userSessions.map((userSession) => (
                <TableRow key={userSession.employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {userSession.employee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{userSession.employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {userSession.employee.department} • {userSession.employee.position}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        userSession.session.isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-muted'
                      }`}></div>
                      <Badge variant={userSession.session.isLoggedIn ? "default" : "secondary"}>
                        {formatStatus(userSession.session.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {userSession.session.clockIn ? (
                      <div>
                        <div className="font-medium">{formatTime24(userSession.session.clockIn)}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(userSession.session.clockIn)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not logged in</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {userSession.session.isLoggedIn ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">
                          {calculateSessionDuration(userSession.session.clockIn)}
                        </span>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatDuration(userSession.session.totalHours)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{userSessions.filter(s => s.session.isLoggedIn).length}</span> active sessions
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh every 30 seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSessionsList;
