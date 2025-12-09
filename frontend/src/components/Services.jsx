import './Services.css'

function Services() {
    const services = [
        {
            icon: '🧠',
            title: 'Neural Data Extraction',
            description: 'Proprietary vision models parse electoral rolls instantly. Zero-error PDF digitization powered by Gemini Vision.',
            features: ['Optical Character Recognition', 'Semantic Data Parsing', 'Auto-Correction', 'CSV/Excel Export']
        },
        {
            icon: '💬',
            title: 'Hyper-Personalized Outreach',
            description: 'Generate millions of unique message variations. Speak to every voter like you know them personally.',
            features: ['Dynamic Context Injection', 'Sentiment Optimization', 'Regional Dialect Support', 'A/B Testing']
        },
        {
            icon: '🛡️',
            title: 'Sovereign Security',
            description: 'Enterprise-grade encryption for your campaign data. Your strategy remains classified and protected.',
            features: ['End-to-End Encryption', 'Zero-Log Policy', 'Checkpoint Recovery', 'Role-Based Access']
        },
        {
            icon: '📈',
            title: 'Real-Time Intel',
            description: 'Live mission dashboard tracking every message sent. Identify swing voters and optimize strategy on the fly.',
            features: ['Live Telemetry', 'Failure Analysis', 'Session Replay', 'Performance Heatmaps']
        },
        {
            icon: '⚡',
            title: 'Lightning Infrastructure',
            description: 'Architecture built for speed. Process entire constituencies in hours, not weeks.',
            features: ['Parallel Processing', 'Smart Queueing', 'Distributed Sending', '10x Speed Multiplier']
        },
        {
            icon: '🤖',
            title: 'Autonomous Agents',
            description: 'AI agents that handle replies and engagement automatically, escalating only critical leads.',
            features: ['Auto-Response', 'Intent Classification', 'Lead Scoring', '24/7 Operation']
        }
    ]

    return (
        <section className="services" id="features">
            <div className="container">
                <div className="section-header">
                    <span className="badge">Capabilities</span>
                    <h2>The <span className="text-gradient">VoteFlow</span> Arsenal</h2>
                    <p>Next-generation tools for modern political warfare</p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div className="service-card glass-card" key={index}>
                            <div className="service-icon">{service.icon}</div>
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>
                            <ul className="service-features">
                                {service.features.map((feature, i) => (
                                    <li key={i}>
                                        <span className="check-icon">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Services
