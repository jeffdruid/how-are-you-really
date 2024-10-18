import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthStatus = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      {currentUser ? (
        <p>Logged in as: {currentUser.email}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
};

export default AuthStatus;
