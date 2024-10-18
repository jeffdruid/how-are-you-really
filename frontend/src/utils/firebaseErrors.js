export const firebaseErrorMessages = (errorCode) => {
    const errors = {
      // Sign-Up Errors
      'auth/email-already-in-use': 'This email is already associated with an account.',
      'auth/invalid-email': 'The email address is not valid.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/weak-password': 'The password is too weak. It should be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.',
  
      // Login Errors
      'auth/user-disabled': 'This user account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
  
      // General Errors
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    };
  
    return errors[errorCode] || 'An unexpected error occurred. Please try again.';
  };
  