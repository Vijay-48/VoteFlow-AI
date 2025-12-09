import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { isDevAccount } from '../config/devConfig'
import './Navbar.css'

function Navbar({ onLaunchCampaign }) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { isSignedIn, user } = useUser()
    const navigate = useNavigate()
    const location = useLocation()

    // Check if current user is a developer
    const userEmail = user?.primaryEmailAddress?.emailAddress
    const isDevUser = isDevAccount(userEmail)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLaunch = () => {
        setMobileMenuOpen(false)
        if (isSignedIn) {
            onLaunchCampaign?.()
        }
    }

    // Handle anchor link navigation (works from any page)
    const handleAnchorClick = (e, sectionId) => {
        e.preventDefault()
        setMobileMenuOpen(false)

        if (location.pathname !== '/') {
            navigate('/')
            setTimeout(() => {
                const element = document.getElementById(sectionId)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        } else {
            const element = document.getElementById(sectionId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    // Handle Console click - dev users have direct access
    const handleConsoleClick = (e) => {
        e.preventDefault()
        setMobileMenuOpen(false)

        if (!isSignedIn) {
            return // SignInButton wrapper handles this
        }

        // Dev users always have access
        if (isDevUser) {
            navigate('/dashboard')
            return
        }

        // Check if user has paid
        const hasPaid = localStorage.getItem('voteflow_paid_campaign')

        if (hasPaid) {
            navigate('/dashboard')
        } else {
            onLaunchCampaign?.()
        }
    }

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-container">
                <Link to="/" className="logo">
                    <span className="logo-icon">💠</span>
                    <span className="logo-text">VoteFlow<span className="text-gradient">AI</span></span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
                </button>

                {/* Navigation Links */}
                <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <a href="#features" onClick={(e) => handleAnchorClick(e, 'features')}>Features</a>
                    <a href="#pricing" onClick={(e) => handleAnchorClick(e, 'pricing')}>Pricing</a>

                    {/* Console - Protected by auth and payment (dev users bypass) */}
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="nav-dashboard-link nav-btn">
                                <span className="live-dot"></span> Console
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <button className="nav-dashboard-link nav-btn" onClick={handleConsoleClick}>
                            <span className="live-dot"></span> Console
                            {isDevUser && <span className="dev-badge">DEV</span>}
                        </button>
                    </SignedIn>
                </div>

                <div className="nav-actions">
                    {/* Dev Badge */}
                    {isDevUser && (
                        <span className="dev-mode-badge">🔧 Dev Mode</span>
                    )}

                    {/* Clerk Auth */}
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn btn-secondary auth-btn">
                                Login
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "clerk-avatar"
                                }
                            }}
                        />
                    </SignedIn>

                    {/* Launch Campaign Button */}
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn btn-primary">
                                <span>🚀</span> Launch
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <button className="btn btn-primary" onClick={handleLaunch}>
                            <span>🚀</span> Launch
                        </button>
                    </SignedIn>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
