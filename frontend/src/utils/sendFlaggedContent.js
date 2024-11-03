import axios from "axios";

// Function to send flagged content to Django REST Framework (DRF) backend
export const sendFlaggedContentToDRF = async (data, token) => {
  try {
    // Log the data being sent for debugging purposes
    console.log("Sending data to DRF:", data);

    // Make a POST request to the DRF endpoint with the provided data and token
    const response = await axios.post(
      "http://127.0.0.1:8000/api/flagged-content/", // DRF endpoint URL
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`, // JWT token for authentication
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error sending flagged content:", error.response || error);
    throw error;
  }
};
