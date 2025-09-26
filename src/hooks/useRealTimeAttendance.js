import { useState, useEffect, useRef } from 'react';
import { attendanceAPI } from '../services/api';

const useRealTimeAttendance = (userId, interval = 30000) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchCurrentAttendance = async () => {
    try {
      const response = await attendanceAPI.getMyAttendance({ limit: 1 });
      if (response.data.attendance.length > 0) {
        const current = response.data.attendance[0];
        setAttendance(current);
      } else {
        setAttendance(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCurrentAttendance();

    // Set up interval for real-time updates
    intervalRef.current = setInterval(fetchCurrentAttendance, interval);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, interval]);

  const refreshAttendance = () => {
    fetchCurrentAttendance();
  };

  return {
    attendance,
    loading,
    error,
    refreshAttendance
  };
};

export default useRealTimeAttendance;
