import './Testimonials.css'

function Testimonials() {
    const testimonials = [
        {
            quote: "VoteFlow AI helped us reach 5,000+ voters in just 2 days. The AI personalization made each message feel personal. We won by a huge margin!",
            name: "Rajesh Kumar",
            role: "Municipal Councillor, Ward 12",
            location: "Hyderabad",
            image: "👨‍💼"
        },
        {
            quote: "The voter data extraction saved us weeks of manual work. Extracted 3,000 voter details from PDF in minutes with 99% accuracy.",
            name: "Priya Sharma",
            role: "Campaign Manager",
            location: "Bangalore",
            image: "👩‍💻"
        },
        {
            quote: "Best investment for our election campaign. The checkpoint system ensured we never lost progress even when WhatsApp had issues.",
            name: "Venkat Rao",
            role: "Gram Panchayat Sarpanch",
            location: "Andhra Pradesh",
            image: "👨‍🌾"
        }
    ]

    return (
        <section className="testimonials" id="testimonials">
            <div className="container">
                <div className="section-header">
                    <span className="badge">Testimonials</span>
                    <h2>Trusted by <span className="gradient-text">Winning Campaigns</span></h2>
                    <p>See what our successful clients have to say</p>
                </div>

                <div className="testimonials-grid">
                    {testimonials.map((testimonial, index) => (
                        <div className="testimonial-card glass-card" key={index}>
                            <div className="quote-icon">"</div>
                            <p className="quote">{testimonial.quote}</p>
                            <div className="testimonial-author">
                                <div className="author-avatar">{testimonial.image}</div>
                                <div className="author-info">
                                    <h4>{testimonial.name}</h4>
                                    <span>{testimonial.role}</span>
                                    <span className="location">📍 {testimonial.location}</span>
                                </div>
                            </div>
                            <div className="stars">★★★★★</div>
                        </div>
                    ))}
                </div>

                <div className="trust-badges">
                    <div className="trust-item">
                        <span className="trust-number">100+</span>
                        <span className="trust-label">Campaigns Completed</span>
                    </div>
                    <div className="trust-divider"></div>
                    <div className="trust-item">
                        <span className="trust-number">50K+</span>
                        <span className="trust-label">Messages Delivered</span>
                    </div>
                    <div className="trust-divider"></div>
                    <div className="trust-item">
                        <span className="trust-number">95%</span>
                        <span className="trust-label">Client Satisfaction</span>
                    </div>
                    <div className="trust-divider"></div>
                    <div className="trust-item">
                        <span className="trust-number">15+</span>
                        <span className="trust-label">States Covered</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonials
