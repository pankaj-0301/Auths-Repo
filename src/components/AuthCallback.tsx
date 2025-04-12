import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const user = searchParams.get('user');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (error) {
        navigate(`/login?error=${error}`);
        return;
      }

      if (token && user) {
        try {
          // Store the JWT token
          localStorage.setItem('token', token);
          
          // Parse the user data
          const userData = JSON.parse(user);
          
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Redirect to profile page
          navigate('/profile');
        } catch (err) {
          console.error('Error in auth callback:', err);
          navigate('/login?error=Authentication failed');
        }
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [token, user, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Processing authentication...</h2>
      </div>
    </div>
  );
}