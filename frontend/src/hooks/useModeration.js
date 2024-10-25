import { useState } from "react";

const useModeration = () => {
  const [error, setError] = useState("");

  const checkModeration = async (content, token, post_id, user) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/flagged-content/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Firebase token
          },
          body: JSON.stringify({
            content,
            post_id, // Add post_id here
            user, // Add user here
            reason: "Trigger words detected", // Set a default reason or dynamically
          }),
        }
      );

      const data = await response.json();

      if (data.flagged) {
        setError(data.message || "Content contains trigger words.");
        return false;
      }

      setError(""); // Clear error if content is safe
      return true;
    } catch (err) {
      setError("Error connecting to the moderation service.");
      console.error("Moderation error:", err);
      return false;
    }
  };

  return { checkModeration, error };
};

export default useModeration;
