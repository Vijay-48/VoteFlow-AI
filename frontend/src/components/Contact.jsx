import { useState } from 'react'
import './Contact.css'

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        constituency: '',
        message: ''
    })
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Here you would typically send the data to a backend
        console.log('Form submitted:', formData)
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 5000)
    }

    return (
        <section className="contact" id="contact">
            <div className="container">
                <div className="contact-wrapper">
                    <div className="contact-info">
                        <span className="badge">Get In Touch</span>
                        <h2>Ready to <span className="gradient-text">Win Your Election?</span></h2>
                        <p>Let's discuss how VoteFlow AI can help you reach more voters and run a successful campaign.</p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <span className="contact-icon">📞</span>
                                <div>
                                    <span className="contact-label">Phone</span>
                                    <a href="tel:+919876543210">+91 98765 43210</a>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="contact-icon">📧</span>
                                <div>
                                    <span className="contact-label">Email</span>
                                    <a href="mailto:info@voteflow.ai">info@voteflow.ai</a>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="contact-icon">📍</span>
                                <div>
                                    <span className="contact-label">Location</span>
                                    <span>Hyderabad, Telangana, India</span>
                                </div>
                            </div>
                            <div className="contact-item">
                                <span className="contact-icon">⏰</span>
                                <div>
                                    <span className="contact-label">Working Hours</span>
                                    <span>Mon-Sat: 9AM - 8PM</span>
                                </div>
                            </div>
                        </div>

                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="WhatsApp">💬</a>
                            <a href="#" className="social-link" aria-label="Twitter">🐦</a>
                            <a href="#" className="social-link" aria-label="LinkedIn">💼</a>
                            <a href="#" className="social-link" aria-label="YouTube">▶️</a>
                        </div>
                    </div>

                    <div className="contact-form-wrapper glass-card">
                        {submitted ? (
                            <div className="success-message">
                                <span className="success-icon">✅</span>
                                <h3>Thank You!</h3>
                                <p>We've received your message and will get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form">
                                <h3>Start Your Campaign Today</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Your name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number *</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+91 98765 43210"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="constituency">Constituency / Ward</label>
                                    <input
                                        type="text"
                                        id="constituency"
                                        name="constituency"
                                        value={formData.constituency}
                                        onChange={handleChange}
                                        placeholder="e.g., Ward 4, Rajapuram"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Tell us about your campaign</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="When is your election? How many voters do you need to reach?"
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    🚀 Get Free Consultation
                                </button>
                                <p className="form-note">We'll respond within 24 hours. No spam, guaranteed.</p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Contact
