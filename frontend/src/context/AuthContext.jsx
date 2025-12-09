import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check for existing session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('voteflow_user')
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser))
            } catch (e) {
                localStorage.removeItem('voteflow_user')
            }
        }
        setIsLoading(false)
    }, [])

    // Login function
    const login = (userData) => {
        setUser(userData)
        localStorage.setItem('voteflow_user', JSON.stringify(userData))
    }

    // Logout function
    const logout = () => {
        setUser(null)
        localStorage.removeItem('voteflow_user')
    }

    // Simple signup (stores locally for demo)
    const signup = (name, email, phone) => {
        const userData = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            createdAt: new Date().toISOString()
        }
        login(userData)
        return userData
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
            signup
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
