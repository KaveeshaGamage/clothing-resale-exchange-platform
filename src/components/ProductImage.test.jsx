import { fireEvent, render, screen } from "@testing-library/react";
import ProductImage from "./ProductImage";

describe("ProductImage", () => {
  it("uses the first image from a serialized image collection", () => {
    render(
      <ProductImage
        src={JSON.stringify(["/first.jpg", "/second.jpg"])}
        alt="A jacket"
      />
    );

    expect(screen.getByRole("img", { name: "A jacket" })).toHaveAttribute("src", "/first.jpg");
  });

  it("uses the local fallback when the image fails to load", () => {
    render(<ProductImage src="/missing.jpg" alt="Missing product" />);
    const image = screen.getByRole("img", { name: "Missing product" });

    fireEvent.error(image);

    expect(image.getAttribute("src")).toBe("/product-placeholder.svg");
  });
});
