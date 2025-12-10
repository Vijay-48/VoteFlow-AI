import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { isDevAccount, getDevPlan, DEV_FEATURES } from '../config/devConfig'
import './PaymentModal.css'

const API_BASE = import.meta.env.VITE_API_BASE

// Plan definitions with campaign limits
const PLANS = [
    {
        id: 'ward',
        name: 'Ward',
        price: '999',
        campaigns: 1,
        maxMessages: 500,
        description: 'For local panchayat & ward elections',
        features: ['Up to 500 messages', '1 voter list extraction', 'Basic support']
    },
    {
        id: 'municipal',
        name: 'Municipal',
        price: '2,499',
        campaigns: 3,
        maxMessages: 2000,
        description: 'For municipal & council elections',
        popular: true,
        features: ['Up to 2,000 messages', '5 extractions', 'AI personalization', 'Priority support']
    },
    {
        id: 'assembly',
        name: 'Assembly',
        price: '4,999',
        campaigns: 5,
        maxMessages: 10000,
        description: 'For MLA & large-scale campaigns',
        features: ['Up to 10,000 messages', 'Unlimited extractions', 'Custom AI', '24/7 support']
    }
]

function PaymentModal({ plan: initialPlan, onClose }) {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const { user } = useUser()

    // Check if current user is a developer
    const userEmail = user?.primaryEmailAddress?.emailAddress
    const isDevUser = isDevAccount(userEmail)

    // Step 0: Select Plan, 1: Upload, 2: Message, 3: Payment, 4: Confirm
    const [step, setStep] = useState(initialPlan ? 1 : 0)
    const [selectedPlan, setSelectedPlan] = useState(
        isDevUser ? getDevPlan() : (initialPlan || PLANS[1])
    )
    const [votersFile, setVotersFile] = useState(null)
    const [extractedVoters, setExtractedVoters] = useState([])
    const [messageTemplate, setMessageTemplate] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    const [remainingCampaigns, setRemainingCampaigns] = useState(null)
    const [paymentId, setPaymentId] = useState('')

    // Check remaining campaigns on mount and set dev plan if dev user
    useEffect(() => {
        if (isDevUser) {
            setSelectedPlan(getDevPlan())
            // Dev users don't have campaign limits
            setRemainingCampaigns(999)
        } else {
            const userData = localStorage.getItem('voteflow_user_campaigns')
            if (userData) {
                const data = JSON.parse(userData)
                setRemainingCampaigns(data.remaining)
            }
        }
    }, [isDevUser])

    // Default message template
    const defaultMessage = `నమస్కారం!

మీ ఓటు మా బలం. మీ విలువైన ఓటుతో మమ్మల్ని గెలిపించండి.

ధన్యవాదాలు 🙏`

    // Sanitize input to prevent XSS
    const sanitizeInput = (input) => {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
    }

    // Handle plan selection
    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan)
        setStep(1)
    }

    // Handle file upload and extraction
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files are allowed')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }

        setVotersFile(file)
        setIsExtracting(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${API_BASE}/api/extract-pdf`, {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (data.success) {
                // Limit voters based on plan
                const maxVoters = selectedPlan.maxMessages
                const voters = data.data.voters.slice(0, maxVoters)

                if (data.data.voters.length > maxVoters) {
                    setError(`Plan limit: Only first ${maxVoters} voters loaded`)
                }

                setExtractedVoters(voters)
                setStep(2)
            } else {
                setError(data.detail || 'Failed to extract voters')
            }
        } catch (e) {
            setError('Server error. Make sure backend is running.')
        } finally {
            setIsExtracting(false)
        }
    }

    // Proceed to payment (or skip for dev users)
    const handleProceedToPayment = () => {
        if (!messageTemplate.trim()) {
            setMessageTemplate(defaultMessage)
        }

        // Dev users skip payment, go directly to confirmation
        if (isDevUser) {
            handleDevStartCampaign()
        } else {
            setStep(3)
        }
    }

    // Dev users can start campaign without payment
    const handleDevStartCampaign = async () => {
        setIsProcessing(true)
        setError('')

        try {
            const res = await fetch(`${API_BASE}/api/campaign/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voters_data: extractedVoters,
                    message_template: messageTemplate || defaultMessage,
                    plan_id: 'dev',
                    max_messages: 999999
                })
            })

            const data = await res.json()

            if (data.success) {
                localStorage.setItem('voteflow_paid_campaign', JSON.stringify({
                    campaignId: data.campaign_id,
                    timestamp: Date.now(),
                    isDev: true
                }))

                onClose()
                navigate('/dashboard', {
                    state: {
                        campaignId: data.campaign_id,
                        autoStart: true,
                        voters: extractedVoters,
                        message: messageTemplate || defaultMessage
                    }
                })
            } else {
                setError(data.detail || 'Failed to start campaign')
            }
        } catch (e) {
            setError('Failed to start campaign. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    // Razorpay Payment Link
    const RAZORPAY_LINK = import.meta.env.VITE_RAZORPAY_LINK

    // Open Razorpay payment link
    const handlePayment = () => {
        // Sanitize message before storing
        const sanitizedMessage = sanitizeInput(messageTemplate || defaultMessage)

        localStorage.setItem('voteflow_pending_campaign', JSON.stringify({
            voters: extractedVoters,
            message: sanitizedMessage,
            plan: selectedPlan,
            timestamp: Date.now()
        }))

        window.open(RAZORPAY_LINK, '_blank')
        setStep(4)
    }

    // Verify payment ID and start campaign
    const handleVerifyPayment = async () => {
        setIsProcessing(true)
        setError('')

        // Validate payment ID format (Razorpay format: pay_xxxxxxxxxxxxxx)
        const paymentIdPattern = /^pay_[a-zA-Z0-9]{10,30}$/
        if (!paymentIdPattern.test(paymentId)) {
            setError('Invalid Payment ID format. It should look like: pay_xxxxxxxxxxxxxxx')
            setIsProcessing(false)
            return
        }

        try {
            // Verify payment with backend
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_id: paymentId,
                    plan_id: selectedPlan.id,
                    amount: parseInt(selectedPlan.price.replace(/,/g, ''))
                })
            })

            const verifyData = await verifyRes.json()

            if (!verifyData.verified) {
                setError(verifyData.message || 'Payment verification failed. Please check your Payment ID.')
                setIsProcessing(false)
                return
            }

            // Payment verified - start campaign
            const res = await fetch(`${API_BASE}/api/campaign/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voters_data: extractedVoters,
                    message_template: messageTemplate || defaultMessage,
                    plan_id: selectedPlan.id,
                    max_messages: selectedPlan.maxMessages,
                    payment_id: paymentId
                })
            })

            const data = await res.json()

            if (data.success) {
                // Clear pending and set paid campaign with remaining count
                localStorage.removeItem('voteflow_pending_campaign')

                // Update campaign count
                const existingData = localStorage.getItem('voteflow_user_campaigns')
                let userData = existingData ? JSON.parse(existingData) : { total: 0, remaining: 0 }

                if (userData.planId !== selectedPlan.id) {
                    // New plan purchase
                    userData = {
                        planId: selectedPlan.id,
                        planName: selectedPlan.name,
                        total: selectedPlan.campaigns,
                        remaining: selectedPlan.campaigns - 1,
                        purchaseDate: Date.now(),
                        paymentId: paymentId
                    }
                } else {
                    // Use existing plan
                    userData.remaining = Math.max(0, userData.remaining - 1)
                }

                localStorage.setItem('voteflow_user_campaigns', JSON.stringify(userData))
                localStorage.setItem('voteflow_paid_campaign', JSON.stringify({
                    campaignId: data.campaign_id,
                    paymentId: paymentId,
                    timestamp: Date.now()
                }))

                onClose()
                navigate('/dashboard', {
                    state: {
                        campaignId: data.campaign_id,
                        autoStart: true,
                        voters: extractedVoters,
                        message: messageTemplate || defaultMessage
                    }
                })
            } else {
                setError(data.detail || 'Failed to start campaign')
            }
        } catch (e) {
            setError('Failed to verify payment. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const votersWithMobile = extractedVoters.filter(v =>
        v.MOBILE && v.MOBILE !== 'N/A' && v.MOBILE !== 'UNCLEAR'
    ).length

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>🚀 Start Campaign</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Plan Summary (if plan selected) */}
                {step > 0 && (
                    <div className="plan-summary">
                        <div className="plan-info">
                            <span className="plan-name">{selectedPlan.name} Plan</span>
                            <span className="plan-campaigns">{selectedPlan.campaigns} campaign{selectedPlan.campaigns > 1 ? 's' : ''}</span>
                        </div>
                        <span className="plan-price">₹{selectedPlan.price}</span>
                    </div>
                )}

                {/* Steps Indicator */}
                {step > 0 && (
                    <div className="steps-indicator">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>
                )}

                {/* Step 0: Plan Selection */}
                {step === 0 && (
                    <div className="step-content plan-selection">
                        <h3>📋 Choose Your Plan</h3>
                        <p>Select the plan that best fits your campaign needs</p>

                        <div className="plan-cards">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${plan.popular ? 'popular' : ''}`}
                                    onClick={() => handlePlanSelect(plan)}
                                >
                                    {plan.popular && <span className="popular-tag">Popular</span>}
                                    <h4>{plan.name}</h4>
                                    <div className="plan-card-price">
                                        <span className="currency">₹</span>
                                        <span className="amount">{plan.price}</span>
                                    </div>
                                    <p className="plan-desc">{plan.description}</p>
                                    <ul className="plan-card-features">
                                        {plan.features.map((f, i) => (
                                            <li key={i}>✓ {f}</li>
                                        ))}
                                    </ul>
                                    <div className="campaign-count">
                                        {plan.campaigns} campaign{plan.campaigns > 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="step-content">
                        <h3>📄 Upload Voter List</h3>
                        <p>Upload your voter list PDF with handwritten mobile numbers</p>

                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />

                        <button
                            className="upload-btn"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isExtracting}
                        >
                            {isExtracting ? (
                                <>⏳ Extracting with AI...</>
                            ) : votersFile ? (
                                <>✅ {votersFile.name}</>
                            ) : (
                                <>📤 Select PDF File</>
                            )}
                        </button>

                        {isExtracting && (
                            <div className="extraction-progress">
                                <div className="spinner"></div>
                                <p>Gemini AI is reading handwritten numbers...</p>
                            </div>
                        )}

                        <button className="back-btn" onClick={() => setStep(0)}>
                            ← Change Plan
                        </button>
                    </div>
                )}

                {/* Step 2: Message */}
                {step === 2 && (
                    <div className="step-content">
                        <h3>✏️ Campaign Message</h3>
                        <p>Customize your message (AI will personalize for each voter)</p>

                        <div className="voters-summary">
                            <span>📊 {extractedVoters.length} voters extracted</span>
                            <span>📱 {votersWithMobile} with mobile numbers</span>
                        </div>

                        <textarea
                            className="message-textarea"
                            placeholder={defaultMessage}
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            rows={6}
                            maxLength={1000}
                        />
                        <div className="char-count">{messageTemplate.length}/1000</div>

                        <button
                            className="btn btn-primary"
                            onClick={handleProceedToPayment}
                        >
                            Continue to Payment →
                        </button>
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                    <div className="step-content">
                        <h3>💳 Complete Payment</h3>

                        <div className="payment-summary">
                            <div className="summary-row">
                                <span>Plan</span>
                                <span>{selectedPlan.name}</span>
                            </div>
                            <div className="summary-row">
                                <span>Campaigns</span>
                                <span>{selectedPlan.campaigns}x</span>
                            </div>
                            <div className="summary-row">
                                <span>Voters</span>
                                <span>{votersWithMobile} contacts</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>₹{selectedPlan.price}</span>
                            </div>
                        </div>

                        <button className="pay-btn" onClick={handlePayment}>
                            🔒 Pay ₹{selectedPlan.price} via Razorpay
                        </button>

                        <p className="secure-note">🔐 Secured payment via Razorpay</p>
                    </div>
                )}

                {/* Step 4: Payment Verification */}
                {step === 4 && (
                    <div className="step-content">
                        <h3>🔐 Verify Payment</h3>
                        <p>Enter your Razorpay Payment ID to verify and start your campaign.</p>

                        <div className="payment-confirm-box">
                            <div className="confirm-icon">💳</div>
                            <p>Complete payment on Razorpay first</p>
                            <a
                                href={RAZORPAY_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="reopen-link"
                            >
                                Open Payment Page →
                            </a>
                        </div>

                        <div className="payment-id-section">
                            <label>Payment ID (from Razorpay receipt):</label>
                            <input
                                type="text"
                                className="payment-id-input"
                                placeholder="pay_xxxxxxxxxxxxxxx"
                                value={paymentId}
                                onChange={(e) => setPaymentId(e.target.value.trim())}
                            />
                            <small className="payment-id-hint">
                                Find this in your Razorpay payment confirmation email or SMS
                            </small>
                        </div>

                        <button
                            className="pay-btn"
                            onClick={handleVerifyPayment}
                            disabled={isProcessing || !paymentId || paymentId.length < 10}
                        >
                            {isProcessing ? (
                                <>⏳ Verifying Payment...</>
                            ) : (
                                <>🔒 Verify & Start Campaign</>
                            )}
                        </button>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setStep(3)}
                            style={{ marginTop: '12px', width: '100%' }}
                        >
                            ← Go Back
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="error-message">
                        ❌ {error}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentModal
