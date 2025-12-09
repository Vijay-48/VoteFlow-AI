import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'
import './Hero.css'

function Hero({ onLaunchCampaign }) {
    const { isSignedIn } = useUser()

    const handleLaunch = () => {
        if (isSignedIn) {
            onLaunchCampaign?.()
        }
    }

    return (
        <section className="hero" id="hero">
            <div className="hero-bg">
                <div className="hero-gradient-1"></div>
                <div className="hero-gradient-2"></div>
                <div className="hero-grid"></div>
            </div>

            <div className="container hero-container">
                <div className="hero-content">
                    <h1>
                        Democracy Upgraded with{' '}
                        <span className="text-gradient">Neural Intelligence</span>
                    </h1>

                    <p className="hero-description">
                        VoteFlow AI combines military-grade data extraction with hyper-personalized voter outreach.
                        Execute massive campaigns with the precision of a surgical strike.
                    </p>

                    <div className="hero-actions">
                        {/* Show SignIn button if not logged in, otherwise show Launch */}
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="btn btn-primary">
                                    <span>⚡</span> Get Started
                                </button>
                            </SignInButton>
                        </SignedOut>

                        <SignedIn>
                            <button className="btn btn-primary" onClick={handleLaunch}>
                                <span>⚡</span> Launch Campaign
                            </button>
                        </SignedIn>

                        <a href="#how-it-works" className="btn btn-secondary">
                            <span>▶️</span> How It Works
                        </a>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">50K+</span>
                            <span className="stat-label">Messages Sent</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-number">100+</span>
                            <span className="stat-label">Campaigns</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-number">95%</span>
                            <span className="stat-label">Delivery Rate</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-card hero-card-1">
                        <div className="card-icon">📊</div>
                        <div className="card-content">
                            <span className="card-label">Voters Extracted</span>
                            <span className="card-value">2,847</span>
                        </div>
                        <div className="card-progress">
                            <div className="progress-bar" style={{ width: '85%' }}></div>
                        </div>
                    </div>

                    <div className="hero-card hero-card-2">
                        <div className="card-icon">📱</div>
                        <div className="card-content">
                            <span className="card-label">Messages Sent</span>
                            <span className="card-value">1,523 / 2,847</span>
                        </div>
                        <div className="card-status">
                            <span className="status-dot"></span>
                            System Active
                        </div>
                    </div>

                    <div className="hero-card hero-card-3">
                        <div className="card-icon">✅</div>
                        <div className="card-content">
                            <span className="card-label">Success Rate</span>
                            <span className="card-value text-gradient">98.5%</span>
                        </div>
                    </div>

                    <div className="floating-element floating-1">🗳️</div>
                    <div className="floating-element floating-2">📣</div>
                    <div className="floating-element floating-3">🎯</div>
                </div>
            </div>
        </section>
    )
}

export default Hero
