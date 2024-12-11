import React, { useState } from "react";
import { getAuth } from "firebase/auth";

const TestApiButton = () => {
  const [apiResponse, setApiResponse] = useState("");
  const [error, setError] = useState("");

  const testAuthenticatedRequest = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User is not logged in.");
      }

      const idToken = await currentUser.getIdToken(/* forceRefresh */ true);

      // Make the authenticated request to the Django API
      const response = await fetch(
        "https://drf-api-jeff-00b8a22f06d7.herokuapp.com/api/flagged-content/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      if (data.message) {
        // Handle the custom message from the backend
        setApiResponse(data.message);
      } else {
        // Handle actual data
        setApiResponse(`Flagged content received: ${JSON.stringify(data)}`);
      }

      setError(""); // Clear any previous errors
    } catch (error) {
      setError(`Error making authenticated request: ${error.message}`);
      setApiResponse(""); // Clear previous successful responses
    }
  };

  return (
    <div>
      <button onClick={testAuthenticatedRequest}>Test API</button>

      {/* Display API response or error */}
      {apiResponse && (
        <div style={{ marginTop: "10px", color: "green" }}>{apiResponse}</div>
      )}
      {error && <div style={{ marginTop: "10px", color: "red" }}>{error}</div>}
    </div>
  );
};

export default TestApiButton;
