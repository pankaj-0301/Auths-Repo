import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Profile() {
  const [searchParams] = useSearchParams();
  const [displayUser, setDisplayUser] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const userData = JSON.parse(userParam);
        setDisplayUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    } else {
      // Try to get user data from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setDisplayUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Error parsing stored user data:', err);
        }
      }
    }
  }, [searchParams]);

  if (!displayUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            {displayUser.profilePicture && (
              <img
                src={displayUser.profilePicture}
                alt="Profile"
                className="mx-auto h-32 w-32 rounded-full"
              />
            )}
            <h2 className="mt-4 text-2xl font-bold text-gray-900">{displayUser.name}</h2>
            <p className="mt-2 text-gray-600">{displayUser.email}</p>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Connected Accounts</h3>
            <div className="mt-4 space-y-4">
              {displayUser.googleConnected && (
                <div className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-2">Google</span>
                </div>
              )}
              {displayUser.facebookConnected && (
                <div className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-2">Facebook</span>
                </div>
              )}
              {displayUser.linkedinConnected && (
                <div className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-2">LinkedIn</span>
                </div>
              )}
              {displayUser.twitterConnected && (
                <div className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-2">Twitter</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}