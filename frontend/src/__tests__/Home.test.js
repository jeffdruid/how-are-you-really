import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "../components/Home";
import { useAuth } from "../contexts/AuthContext";

// Mock useAuth to return a mock currentUser
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock child components with correct paths
jest.mock("../components/PostFeed", () => () => (
  <div data-testid="post-feed" />
));
jest.mock("../components/CreatePost", () => () => (
  <div data-testid="create-post" />
));
jest.mock("../components/SearchBar", () => () => (
  <div data-testid="search-bar" />
));

describe("Home Component", () => {
  beforeEach(() => {
    // Provide a mock currentUser
    useAuth.mockReturnValue({
      currentUser: { emailVerified: true },
    });
  });

  it("renders without crashing", () => {
    render(<Home />);
    expect(
      screen.getByText(/Welcome to "How Are You Really"/i),
    ).toBeInTheDocument();
  });

  it("displays the welcome banner", () => {
    render(<Home />);
    expect(
      screen.getByText(/An interactive platform where you can express/i),
    ).toBeInTheDocument();
  });

  it("displays the search bar section", () => {
    render(<Home />);
    expect(screen.getByText(/Find Posts and People/i)).toBeInTheDocument();
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
  });

  it("displays the create post section", () => {
    render(<Home />);
    expect(screen.getByText(/Share Your Thoughts/i)).toBeInTheDocument();
    expect(screen.getByTestId("create-post")).toBeInTheDocument();
  });

  it("displays the post feed section", () => {
    render(<Home />);
    expect(screen.getByText(/Recent Posts/i)).toBeInTheDocument();
    expect(screen.getByTestId("post-feed")).toBeInTheDocument();
  });

  it("does not display email verification alert when email is verified", () => {
    render(<Home />);
    expect(screen.queryByText(/Your email is not verified/i)).toBeNull();
  });

  it("displays email verification alert when email is not verified", () => {
    // Update the mock to simulate unverified email
    useAuth.mockReturnValue({
      currentUser: { emailVerified: false },
    });
    render(<Home />);
    expect(
      screen.getByText(/Your email is not verified/i),
    ).toBeInTheDocument();
  });
});
