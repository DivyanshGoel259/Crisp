export interface User {
  id: string
  name: string
  email: string
  role: 'interviewee' | 'interviewer'
  created_at: string
  updated_at: string
}

export interface SignUpData {
  name: string
  email: string
  password: string
  role: 'interviewee' | 'interviewer'
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// Sign up (only for interviewees)
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    return result
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Sign up failed'
    }
  }
}

// Sign in (for both interviewees and interviewers)
export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error }
    }

    return result
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Sign in failed' 
    }
  }
}

// Get current user session
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('currentUser')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Set current user session
export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('currentUser', JSON.stringify(user))
}

// Clear current user session
export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('currentUser')
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}