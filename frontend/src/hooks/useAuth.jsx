import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vnlf-user')
      return saved ? JSON.parse(saved) : null
    }
    return null
  })

  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vnlf-token') || null
    }
    return null
  })

  const login = useCallback((userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('vnlf-user', JSON.stringify(userData))
    localStorage.setItem('vnlf-token', jwtToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('vnlf-user')
    localStorage.removeItem('vnlf-token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
