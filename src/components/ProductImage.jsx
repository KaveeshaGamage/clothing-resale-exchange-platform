const FALLBACK_IMAGE = "/product-placeholder.svg";

function ProductImage({ src, alt, ...imageProps }) {
  let imageSrc = src;
  if (typeof src === "string" && src.startsWith("[")) {
    try {
      const images = JSON.parse(src);
      imageSrc = Array.isArray(images) ? images[0] : src;
    } catch {
      imageSrc = src;
    }
  }

  const handleError = (event) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === "true") {
      image.onerror = null;
      return;
    }

    image.dataset.fallbackApplied = "true";
    image.src = FALLBACK_IMAGE;
  };

  return (
    <img
      {...imageProps}
      src={imageSrc || FALLBACK_IMAGE}
      alt={alt || ""}
      onError={handleError}
    />
  );
}

export default ProductImage;
