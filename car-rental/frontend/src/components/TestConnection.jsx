import { useState } from 'react';
import axios from 'axios';

const TestConnection = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://localhost:8080';

  const testBasicConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing basic connection...');
      const response = await axios.get(`${BASE_URL}/api/bookings/test`, {
        timeout: 5000
      });
      console.log('Basic connection successful:', response.data);
      setResults(prev => ({ ...prev, basic: { success: true, data: response.data } }));
    } catch (error) {
      console.error('Basic connection failed:', error.message);
      setResults(prev => ({ ...prev, basic: { success: false, error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const testAuthConnection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResults(prev => ({ ...prev, auth: { success: false, error: 'No token found' } }));
        return;
      }

      console.log('Testing auth connection...');
      const response = await axios.post(`${BASE_URL}/api/bookings/test-auth`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log('Auth connection successful:', response.data);
      setResults(prev => ({ ...prev, auth: { success: true, data: response.data } }));
    } catch (error) {
      console.error('Auth connection failed:', error.response?.status, error.message);
      setResults(prev => ({ 
        ...prev, 
        auth: { 
          success: false, 
          error: error.message,
          status: error.response?.status 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const testBookingCreation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResults(prev => ({ ...prev, booking: { success: false, error: 'No token found' } }));
        return;
      }

      console.log('Testing booking creation...');
      const response = await axios.post(`${BASE_URL}/api/bookings`, {
        carId: 1,
        pickupLocation: "Test Location",
        dropoffLocation: "Test Location",
        pickupDateTime: "2025-09-01T06:30",
        dropoffDateTime: "2025-09-02T06:30"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      console.log('Booking creation successful:', response.data);
      setResults(prev => ({ ...prev, booking: { success: true, data: response.data } }));
    } catch (error) {
      console.error('Booking creation failed:', error.response?.status, error.response?.data, error.message);
      setResults(prev => ({ 
        ...prev, 
        booking: { 
          success: false, 
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Test Connection</h2>
      
      <div className="space-y-4">
        <button
          onClick={testBasicConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test Basic Connection
        </button>

        <button
          onClick={testAuthConnection}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 ml-2"
        >
          Test Auth Connection
        </button>

        <button
          onClick={testBookingCreation}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50 ml-2"
        >
          Test Booking Creation
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {results.basic && (
          <div className={`p-2 rounded ${results.basic.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <strong>Basic Connection:</strong> {results.basic.success ? 'Success' : 'Failed'}
            {results.basic.data && <div>Data: {results.basic.data}</div>}
            {results.basic.error && <div>Error: {results.basic.error}</div>}
          </div>
        )}

        {results.auth && (
          <div className={`p-2 rounded ${results.auth.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <strong>Auth Connection:</strong> {results.auth.success ? 'Success' : 'Failed'}
            {results.auth.data && <div>Data: {results.auth.data}</div>}
            {results.auth.error && <div>Error: {results.auth.error}</div>}
            {results.auth.status && <div>Status: {results.auth.status}</div>}
          </div>
        )}

        {results.booking && (
          <div className={`p-2 rounded ${results.booking.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <strong>Booking Creation:</strong> {results.booking.success ? 'Success' : 'Failed'}
            {results.booking.data && <div>Data: {JSON.stringify(results.booking.data)}</div>}
            {results.booking.error && <div>Error: {results.booking.error}</div>}
            {results.booking.status && <div>Status: {results.booking.status}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestConnection; 