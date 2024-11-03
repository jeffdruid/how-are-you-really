import { useState } from "react";

const useModeration = () => {
  const [error, setError] = useState("");

  const checkModeration = async (content, token, post_id, user) => {
    try {
      // Connect to the backend to check for trigger words
      const response = await fetch(
        "http://127.0.0.1:8000/api/triggerwords/check/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Firebase token
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();

      if (data.flagged) {
        setError(data.message || "Content contains trigger words.");
        return false; // Content should be flagged
      }

      setError(""); // Clear error if content is safe
      return true; // Content is safe
    } catch (err) {
      setError("Error connecting to the moderation service.");
      console.error("Moderation error:", err);
      return false; // Assume unsafe if there’s an error
    }
  };

  return { checkModeration, error };
};

export default useModeration;
