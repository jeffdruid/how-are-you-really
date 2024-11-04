// sendFlaggedContent.js
export const sendFlaggedContentToDRF = async (data, token) => {
  const payload = {
    user: data.user,
    reason: data.reason,
    content: data.content,
    parent_type: data.parent_type,
    ...(data.parent_type === "post" && { post_id: data.post_id }),
    ...(data.parent_type === "comment" && {
      post_id: data.post_id,
      comment_id: data.comment_id || null,
    }),
    ...(data.parent_type === "reply" && {
      post_id: data.post_id,
      comment_id: data.comment_id,
      reply_id: data.reply_id || null,
    }),
  };

  console.log("Sending data to DRF:", payload);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/flagged-content/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const result = await response.json();
    console.log("Successfully sent flagged content:", result);
    return result;
  } catch (error) {
    // Log any errors that occur during the request
    console.error("Error sending flagged content:", error.response || error);
    throw error;
  }
};
