import { useState } from 'react'
import './FAQ.css'

function FAQ() {
    const [openIndex, setOpenIndex] = useState(0)

    const faqs = [
        {
            question: 'How does the voter data extraction work?',
            answer: 'Our AI-powered system uses Google Gemini Vision to analyze PDF electoral rolls. It automatically detects voter information blocks and extracts names, voter IDs, and other details with high accuracy. The extracted data is then organized into a clean Excel spreadsheet ready for your campaign.'
        },
        {
            question: 'Is WhatsApp automation safe and legal?',
            answer: 'Our system uses official WhatsApp Web interface and mimics natural user behavior with appropriate delays between messages. This helps avoid spam detection. However, we recommend following WhatsApp\'s terms of service and local election commission guidelines. We include smart rate limiting and checkpoint recovery for safe operation.'
        },
        {
            question: 'What languages are supported for messages?',
            answer: 'We fully support Telugu, Hindi, and English languages. Our AI personalization works especially well with regional languages, helping you create authentic, culturally relevant campaign messages that resonate with local voters.'
        },
        {
            question: 'What happens if my campaign is interrupted?',
            answer: 'Our robust checkpoint system automatically saves progress after every batch of messages. If there\'s any interruption (power outage, internet issues, etc.), you can resume exactly where you left off. No message is ever sent twice, and no progress is lost.'
        },
        {
            question: 'How quickly can I start my campaign?',
            answer: 'You can start within hours of signing up. Simply upload your voter PDF, customize your message template, and launch. Our team can help with initial setup if needed. Most campaigns are ready to send within the same day.'
        },
        {
            question: 'Do you provide support during elections?',
            answer: 'Yes! Our Professional and Enterprise plans include priority support. During election periods, we offer extended support hours and dedicated assistance to ensure your campaign runs smoothly. Enterprise clients get a dedicated account manager.'
        }
    ]

    return (
        <section className="faq" id="faq">
            <div className="container">
                <div className="section-header">
                    <span className="badge">FAQ</span>
                    <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
                    <p>Everything you need to know about VoteFlow AI</p>
                </div>

                <div className="faq-container">
                    {faqs.map((faq, index) => (
                        <div
                            className={`faq-item ${openIndex === index ? 'open' : ''}`}
                            key={index}
                            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                        >
                            <div className="faq-question">
                                <h4>{faq.question}</h4>
                                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                            </div>
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="faq-cta">
                    <p>Still have questions?</p>
                    <a href="#contact" className="btn btn-secondary">Contact Us</a>
                </div>
            </div>
        </section>
    )
}

export default FAQ
