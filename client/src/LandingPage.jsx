import React from "react";
import "./LandingPage.css";
import Header from "./Header";
import dubaiBg from "./Images/dubai.jpg"; // Import the image

const Landing = () => {
  return (
    <main>
      <div className="landing" style={{ backgroundImage: `url(${dubaiBg})` }}>
        <div className="overlay"></div>
        <Header transparent={true} />
        <section className="hero">
          <div className="hero-content">
            <h1>Smarter Real Estate Decisions with Agentic AI</h1>
            <p>
              Track rental trends, optimize pricing, and make data-driven
              investment decisions — all from one platform.
            </p>
            <a href="/profile" className="cta-button">
              Get Started
            </a>
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <h2>📈 Market Insights</h2>
            <p>Stay ahead with real-time rental trends and yield forecasts.</p>
          </div>
          <div className="feature">
            <h2>🤖 Smart Pricing</h2>
            <p>Let our AI suggest when to increase or decrease rent.</p>
          </div>
          <div className="feature">
            <h2>📊 ROI Calculator</h2>
            <p>Estimate returns and investment potential for each property.</p>
          </div>
        </section>

        <footer className="footer">
          <p>
            &copy; {new Date().getFullYear()} KeySpammers Real Estate. All
            rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Landing;
