import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/WelcomePage.css";

const slides = [
  {
    eyebrow: "A better way to wear",
    title: "Give good clothes\nanother great story.",
    description:
      "Discover pre-loved pieces, pass on what you no longer wear, and make every choice count.",
    image: "/welcome-shopping.svg",
    alt: "Friends shopping for clothes together",
  },
  {
    eyebrow: "Find your next favourite",
    title: "Style that feels\nlike you.",
    description:
      "Explore one-of-a-kind finds and refreshing wardrobe staples from the resale community.",
    image: "/welcome-style.svg",
    alt: "A curated collection of stylish clothing",
  },
  {
    eyebrow: "Wear it. Love it. Share it.",
    title: "Make room for\nmore possibilities.",
    description:
      "Sell or exchange pieces you love and help keep great fashion in circulation.",
    image: "/welcome-wardrobe.svg",
    alt: "A colorful selection of clothes on a clothing rack",
  },
];

function WelcomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const showSlide = (index) => {
    setActiveSlide((index + slides.length) % slides.length);
  };

  const slide = slides[activeSlide];

  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <a className="welcome-brand" href="#home" aria-label="Rewear home">
          <img className="welcome-brand-icon" src="/rewear-icon.png" alt="" />
          <span>rewear</span>
        </a>

        <nav className="welcome-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#about">About us</a>
          <a href="#contact">Contact us</a>
        </nav>

        <div className="welcome-auth">
          <Link className="welcome-login" to="/login">
            Login
          </Link>
          <Link className="welcome-register" to="/register">
            Sign up
          </Link>
        </div>
      </header>

      <section className="welcome-hero" id="home" aria-label="Welcome">
        <div
          className="welcome-slide-image"
          style={{ backgroundImage: `url("${slide.image}")` }}
          role="img"
          aria-label={slide.alt}
          key={slide.image}
        />
        <div className="welcome-hero-shade" />
        <div className="welcome-hero-content" key={slide.title}>
          <span className="welcome-eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
          <div className="welcome-hero-actions">
            <Link to="/register" className="welcome-primary-button">
              Start exploring <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/login" className="welcome-secondary-button">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="welcome-carousel-controls" aria-label="Slideshow controls">
          <button
            type="button"
            className="welcome-arrow"
            aria-label="Previous slide"
            onClick={() => showSlide(activeSlide - 1)}
          >
            &#8592;
          </button>
          <div className="welcome-dots">
            {slides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={`welcome-dot${index === activeSlide ? " active" : ""}`}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => showSlide(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="welcome-arrow"
            aria-label="Next slide"
            onClick={() => showSlide(activeSlide + 1)}
          >
            &#8594;
          </button>
        </div>
        <span className="welcome-slide-count">
          0{activeSlide + 1} <span>/ 0{slides.length}</span>
        </span>
      </section>

      <section className="welcome-about" id="about">
        <div className="welcome-section-label">A wardrobe with a second life</div>
        <div className="welcome-about-copy">
          <h2>Good style should go around.</h2>
          <p>
            Rewear brings people together to buy, sell, and exchange clothing
            they love. Find something unexpected, give your pieces a new home,
            and make getting dressed feel good in more ways than one.
          </p>
        </div>
        <div className="welcome-values">
          <article>
            <span>01</span>
            <h3>Find your next favourite</h3>
            <p>Explore unique pre-loved pieces picked by real people.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Pass it along</h3>
            <p>List the pieces you are ready to love in a new way.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Wear with purpose</h3>
            <p>Keep good clothes moving and make room for what is next.</p>
          </article>
        </div>

        <section className="welcome-purpose" aria-labelledby="welcome-purpose-title">
          <div className="welcome-purpose-heading">
            <span className="welcome-section-label">What we stand for</span>
            <h2 id="welcome-purpose-title">A more thoughtful future for fashion.</h2>
            <p>
              Rewear is built around a simple belief: when clothes are valued,
              people and the planet both benefit.
            </p>
          </div>
          <div className="welcome-purpose-grid">
            <article className="welcome-purpose-card">
              <span className="welcome-purpose-number">01</span>
              <span className="welcome-purpose-icon" aria-hidden="true">◎</span>
              <h3>Our Aim</h3>
              <p>
                Make buying and selling pre-loved clothing easy, trusted, and
                welcoming for everyone.
              </p>
            </article>
            <article className="welcome-purpose-card">
              <span className="welcome-purpose-number">02</span>
              <span className="welcome-purpose-icon" aria-hidden="true">✳</span>
              <h3>Our Mission</h3>
              <p>
                Connect people and retail partners so good-quality clothes can
                find new owners instead of going to waste.
              </p>
            </article>
            <article className="welcome-purpose-card">
              <span className="welcome-purpose-number">03</span>
              <span className="welcome-purpose-icon" aria-hidden="true">↗</span>
              <h3>Our Vision</h3>
              <p>
                Help shape a circular fashion community where rewearing is a
                natural first choice.
              </p>
            </article>
            <article className="welcome-purpose-card">
              <span className="welcome-purpose-number">04</span>
              <span className="welcome-purpose-icon" aria-hidden="true">♡</span>
              <h3>Our Motivation</h3>
              <p>
                Every garment deserves to be loved for longer—and every small
                choice can make a meaningful difference.
              </p>
            </article>
          </div>
        </section>
      </section>

      <footer className="welcome-footer" id="contact">
        <div>
          <span className="welcome-footer-label">Have a question?</span>
          <h2>Let’s get in touch.</h2>
        </div>
        <a href="mailto:hello@rewear.com" className="welcome-contact-link">
          hello@rewear.com <span aria-hidden="true">↗</span>
        </a>
        <span className="welcome-copyright">© 2026 Rewear. Wear it again.</span>
      </footer>
    </main>
  );
}

export default WelcomePage;
