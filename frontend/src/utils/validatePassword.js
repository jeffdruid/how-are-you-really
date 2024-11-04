export const validatePassword = (password) => {
  // Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
  return re.test(password);
};
