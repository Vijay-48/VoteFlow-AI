import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

function AuthModal({ onClose, onSuccess }) {
    const { login, signup } = useAuth()
    const [mode, setMode] = useState('login') // 'login' or 'signup'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (mode === 'signup') {
                if (!formData.name || !formData.phone) {
                    setError('Name and phone are required')
                    return
                }
                signup(formData.name, formData.email, formData.phone)
            } else {
                // Simple login - just check if phone exists
                if (!formData.phone) {
                    setError('Phone number is required')
                    return
                }
                login({
                    id: Date.now().toString(),
                    name: formData.name || 'User',
                    phone: formData.phone
                })
            }

            onSuccess?.()
            onClose()
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <div className="auth-header">
                    <h2>{mode === 'login' ? '🔐 Welcome Back' : '🚀 Get Started'}</h2>
                    <p>{mode === 'login'
                        ? 'Login to continue your campaign'
                        : 'Create an account to launch your campaign'
                    }</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={handleChange}
                            pattern="[0-9]{10}"
                            required
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className="form-group">
                            <label>Email (optional)</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-submit" disabled={isLoading}>
                        {isLoading ? '⏳ Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-switch">
                    {mode === 'login' ? (
                        <p>Don't have an account? <button onClick={() => setMode('signup')}>Sign Up</button></p>
                    ) : (
                        <p>Already have an account? <button onClick={() => setMode('login')}>Login</button></p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuthModal
