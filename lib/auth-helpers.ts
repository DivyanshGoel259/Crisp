import { supabase } from './supabase'
import { User } from './auth'

// Helper function to get current user from Supabase auth
export async function getCurrentSupabaseUser(): Promise<any> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current Supabase user:', error)
    return null
  }
}

// Helper function to get user role from database
export async function getUserRoleFromDatabase(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

// Helper function to check if user can access candidate
export async function canUserAccessCandidate(candidateUserId: string, currentUserId: string): Promise<boolean> {
  try {
    // Get current user role
    const currentUserRole = await getUserRoleFromDatabase(currentUserId)
    
    // Users can access their own candidates OR interviewers can access all candidates
    return candidateUserId === currentUserId || currentUserRole === 'interviewer'
  } catch (error) {
    console.error('Error checking candidate access:', error)
    return false
  }
}

// Helper function to get candidates for current user
export async function getCandidatesForUser(userId: string, role: string) {
  try {
    let query = supabase
      .from('candidates')
      .select('*')

    // If interviewer, can see all candidates
    // If interviewee, only their own candidates
    if (role === 'interviewee') {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting candidates for user:', error)
    return []
  }
}

// Helper function to create candidate for authenticated user
export async function createCandidateForUser(candidateData: any, userId: string): Promise<any> {
  try {
    const candidateWithUser = {
      ...candidateData,
      user_id: userId
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateWithUser)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating candidate:', error)
    throw error
  }
}

// Helper function to update candidate with security check
export async function updateCandidateSecurely(candidateId: string, updates: any, currentUserId: string): Promise<any> {
  try {
    // First verify the candidate belongs to the user or they are an interviewer
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('user_id')
      .eq('id', candidateId)
      .single()

    if (fetchError) throw fetchError

    // Check if user can modify this candidate
    const canAccess = await canUserAccessCandidate(candidate.user_id, currentUserId)
    if (!canAccess) {
      throw new Error('Unauthorized: Cannot access this candidate')
    }

    // Perform the update
    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', candidateId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating candidate securely:', error)
    throw error
  }
}
