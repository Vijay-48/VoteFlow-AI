import { useState } from 'react'
import './Pricing.css'
import PaymentModal from './PaymentModal'

function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly')
    const [selectedPlan, setSelectedPlan] = useState(null)

    const plans = [
        {
            name: 'Ward',
            description: 'For local panchayat & ward elections',
            price: billingCycle === 'monthly' ? '999' : '2,499',
            period: billingCycle === 'monthly' ? '/campaign' : '/3 campaigns',
            features: [
                'Up to 500 messages',
                '1 voter list PDF extraction',
                'Basic message template',
                'WhatsApp delivery',
                'Progress tracking',
                'Email support'
            ],
            highlighted: false,
            cta: 'Start Campaign'
        },
        {
            name: 'Municipal',
            description: 'For municipal & council elections',
            price: billingCycle === 'monthly' ? '2,499' : '5,999',
            period: billingCycle === 'monthly' ? '/campaign' : '/3 campaigns',
            features: [
                'Up to 2,000 messages',
                '5 voter list extractions',
                'AI message personalization',
                'Handwritten OCR support',
                'Failed message retry',
                'Priority WhatsApp support',
                'Real-time analytics',
                'Audio message support'
            ],
            highlighted: true,
            cta: 'Start Campaign'
        },
        {
            name: 'Assembly',
            description: 'For MLA & large-scale campaigns',
            price: billingCycle === 'monthly' ? '4,999' : '11,999',
            period: billingCycle === 'monthly' ? '/campaign' : '/3 campaigns',
            features: [
                'Up to 10,000 messages',
                'Unlimited PDF extractions',
                'Custom AI training',
                'Multi-language support',
                'Dedicated campaign manager',
                '24/7 phone support',
                'API access',
                'White-label option'
            ],
            highlighted: false,
            cta: 'Start Campaign'
        }
    ]

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan)
    }

    return (
        <>
            <section className="pricing" id="pricing">
                <div className="container">
                    <div className="section-header">
                        <span className="badge">Pricing</span>
                        <h2>Choose Your <span className="text-gradient">Campaign Plan</span></h2>
                        <p>Transparent pricing with no hidden fees</p>
                    </div>

                    <div className="billing-toggle">
                        <span className={billingCycle === 'monthly' ? 'active' : ''}>Per Campaign</span>
                        <button
                            className="toggle-btn"
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        >
                            <span className={`toggle-indicator ${billingCycle === 'yearly' ? 'yearly' : ''}`}></span>
                        </button>
                        <span className={billingCycle === 'yearly' ? 'active' : ''}>
                            Bundle (3x)
                            <span className="save-badge">Save 20%</span>
                        </span>
                    </div>

                    <div className="pricing-grid">
                        {plans.map((plan, index) => (
                            <div
                                className={`pricing-card glass-card ${plan.highlighted ? 'highlighted' : ''}`}
                                key={index}
                            >
                                {plan.highlighted && <div className="popular-badge">Most Popular</div>}
                                <div className="plan-header">
                                    <h3>{plan.name}</h3>
                                    <p>{plan.description}</p>
                                </div>
                                <div className="plan-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{plan.price}</span>
                                    <span className="period">{plan.period}</span>
                                </div>
                                <ul className="plan-features">
                                    {plan.features.map((feature, i) => (
                                        <li key={i}>
                                            <span className="check">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pricing-note">
                        <p>💡 Pay once per campaign • Instant setup • Cancel anytime</p>
                    </div>
                </div>
            </section>

            {/* Payment Modal */}
            {selectedPlan && (
                <PaymentModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                />
            )}
        </>
    )
}

export default Pricing
