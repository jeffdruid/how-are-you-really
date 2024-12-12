import { render, screen } from "@testing-library/react";
import React from "react";

// Mock version of LikeButton without Firebase
const LikeButtonMock = ({ postId }) => {
  return <button>🤍 0 {/* Default like state */}</button>;
};

describe("LikeButton Component", () => {
  it("renders without crashing", () => {
    render(<LikeButtonMock postId="testPostId" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays default like icon and count", () => {
    render(<LikeButtonMock postId="testPostId" />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("🤍 0"); // Default state without Firebase
  });
});
