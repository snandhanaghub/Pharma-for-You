import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SeverityBadge from '../components/ui/SeverityBadge';
import ConfidenceRing from '../components/ui/ConfidenceRing';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar variant="landing" />
      
      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-left">
              <h1 className="hero-title">AI-Powered Drug Interaction Intelligence</h1>
              <p className="hero-text text-muted">
                Get instant, accurate drug interaction analysis powered by advanced AI. 
                Upload prescriptions or manually check drug combinations to ensure patient safety.
              </p>
              <div className="hero-buttons">
                <Link to="/check-interaction">
                  <Button variant="primary">Check Interaction</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline-pink">Learn More</Button>
                </Link>
              </div>
            </div>
            
            <div className="hero-right">
              <div className="preview-card-wrapper">
                <div className="preview-blur"></div>
                <Card borderTop={true} borderColor="primary" className="preview-card">
                  <h3 className="preview-title">Interaction Result</h3>
                  <div className="preview-badge">
                    <SeverityBadge severity="Moderate" />
                  </div>
                  <div className="preview-ring">
                    <ConfidenceRing confidence={92} size={140} />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        <section className="features-section">
          <div className="features-container">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Quick Analysis</h3>
              <p className="feature-text text-muted">
                Get instant drug interaction results with our advanced AI engine
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">OCR Recognition</h3>
              <p className="feature-text text-muted">
                Upload prescriptions and extract drug information automatically
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💊</div>
              <h3 className="feature-title">Comprehensive Database</h3>
              <p className="feature-text text-muted">
                Access extensive drug interaction data from trusted medical sources
              </p>
            </div>
          </div>
        </section>
        
        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to ensure drug safety?</h2>
            <p className="cta-text text-muted">
              Start checking drug interactions now with Pharma4U
            </p>
            <Link to="/login">
              <Button variant="primary">Get Started Free</Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default LandingPage;
