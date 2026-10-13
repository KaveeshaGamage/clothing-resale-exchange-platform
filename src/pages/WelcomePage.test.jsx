import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WelcomePage from "./WelcomePage";

describe("WelcomePage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the welcome content and account navigation", () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /give good clothes another great story/i
    );
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("heading", { name: "Our Mission" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our Vision" })).toBeInTheDocument();
  });

  it("moves between slideshow images using the controls", () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /style that feels like you/i
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /give good clothes another great story/i
    );
  });
});
