import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
    const currentYear = new Date().getFullYear()

    const footerLinks = {
        product: [
            { name: 'Features', href: '#features' },
            { name: 'Pricing', href: '#pricing' },
            { name: 'Technology', href: '#how-it-works' },
            { name: 'Live Console', to: '/dashboard' } // Using 'to' for Router Links
        ],
        company: [
            { name: 'About Us', href: '#' },
            { name: 'Contact', href: '#contact' },
            { name: 'Careers', href: '#' },
            { name: 'Blog', href: '#' }
        ],
        legal: [
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms of Service', href: '#' },
            { name: 'Refund Policy', href: '#' }
        ]
    }

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-top">
                    <div className="footer-brand">
                        <Link to="/" className="logo">
                            <span className="logo-icon">💠</span>
                            <span className="logo-text">VoteFlow<span className="text-gradient">AI</span></span>
                        </Link>
                        <p>Architecting the future of democracy through intelligent automation and data precision.</p>
                        <div className="footer-social">
                            <a href="#" aria-label="WhatsApp">💬</a>
                            <a href="#" aria-label="Twitter">🐦</a>
                            <a href="#" aria-label="LinkedIn">💼</a>
                            <a href="#" aria-label="YouTube">▶️</a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Product</h4>
                            <ul>
                                {footerLinks.product.map((link, i) => (
                                    <li key={i}>
                                        {link.to ?
                                            <Link to={link.to}>{link.name}</Link> :
                                            <a href={link.href}>{link.name}</a>
                                        }
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>Company</h4>
                            <ul>
                                {footerLinks.company.map((link, i) => (
                                    <li key={i}><a href={link.href}>{link.name}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h4>Legal</h4>
                            <ul>
                                {footerLinks.legal.map((link, i) => (
                                    <li key={i}><a href={link.href}>{link.name}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} VoteFlow AI. All rights reserved.</p>
                    <p>Made with ❤️ for Democracy</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
