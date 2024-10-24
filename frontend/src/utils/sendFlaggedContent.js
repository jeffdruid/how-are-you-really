import axios from 'axios';

export const sendFlaggedContentToDRF = async (data, token) => {
  try {

    console.log("Sending data to DRF:", data);
    const response = await axios.post(
      'http://127.0.0.1:8000/api/flagged-content/',
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,  // Make sure the JWT token is passed correctly
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending flagged content:", error.response || error);
    throw error;
  }
};
