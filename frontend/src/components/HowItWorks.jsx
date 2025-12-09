import './HowItWorks.css'

function HowItWorks() {
    const steps = [
        {
            number: '01',
            icon: '📄',
            title: 'Upload Voter PDF',
            description: 'Upload your electoral roll PDF document. Our AI will automatically detect and process voter information.'
        },
        {
            number: '02',
            icon: '🤖',
            title: 'AI Extracts Data',
            description: 'Google Gemini AI analyzes each page, extracting names, voter IDs, and contact details with high accuracy.'
        },
        {
            number: '03',
            icon: '✏️',
            title: 'Customize Message',
            description: 'Create your campaign message with optional AI enhancement for personalized, engaging content.'
        },
        {
            number: '04',
            icon: '🚀',
            title: 'Launch Campaign',
            description: 'Start automated sending. Track progress in real-time with checkpoints and detailed analytics.'
        }
    ]

    return (
        <section className="how-it-works" id="how-it-works">
            <div className="container">
                <div className="section-header">
                    <span className="badge">Technology</span>
                    <h2>The <span className="text-gradient">VoteFlow</span> Engine</h2>
                    <p>AI-powered automation in four precision steps</p>
                </div>

                <div className="steps-container">
                    <div className="steps-line"></div>
                    {steps.map((step, index) => (
                        <div className="step" key={index}>
                            <div className="step-number">{step.number}</div>
                            <div className="step-card glass-card">
                                <div className="step-icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
