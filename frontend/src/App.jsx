import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'
import './App.css'

// Components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Dashboard from './components/Dashboard/Dashboard'
import PaymentModal from './components/PaymentModal'

function LandingPage({ onLaunchCampaign }) {
  return (
    <main className="landing-page">
      <Hero onLaunchCampaign={onLaunchCampaign} />
      <Services />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
    </main>
  )
}

function App() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { user, isSignedIn } = useUser()

  // Default plan for direct launch
  const defaultPlan = {
    name: 'Municipal',
    price: '2,499',
    period: '/campaign'
  }

  const handleLaunchCampaign = () => {
    // If signed in, show payment modal directly
    // If not signed in, Clerk's SignInButton will handle it
    if (isSignedIn) {
      setShowPaymentModal(true)
    }
  }

  return (
    <Router>
      <div className="app">
        <Navbar onLaunchCampaign={handleLaunchCampaign} />
        <Routes>
          <Route path="/" element={<LandingPage onLaunchCampaign={handleLaunchCampaign} />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer />

        {/* Payment Modal - only shown when signed in */}
        <SignedIn>
          {showPaymentModal && (
            <PaymentModal
              plan={defaultPlan}
              onClose={() => setShowPaymentModal(false)}
            />
          )}
        </SignedIn>
      </div>
    </Router>
  )
}

export default App
