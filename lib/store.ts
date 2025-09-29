import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "./supabase"

export interface InterviewSession {
  id: string
  questions: InterviewQuestion[]
  answers: Answer[]
  score: number
  summary: string
  startTime: Date
  endTime?: Date
  status: "completed" | "incomplete"
  profile?: "fullstack-node" | "react"
}

export interface Candidate {
  id: string
  userId: string // Link to users table
  name: string
  email: string
  phone: string
  resumeFile?: File
  resumeText?: string
  status: "uploading" | "info-collection" | "interviewing" | "completed" | "paused"
  currentQuestion: number
  questions: InterviewQuestion[]
  answers: Answer[]
  score: number
  summary: string
  startTime?: Date
  endTime?: Date
  timeRemaining?: number
  lastActiveTime?: Date
  sessionId?: string
  profile?: "fullstack-node" | "react"
  skills?: string[]
  experience?: string[]
  education?: string[]
  missingInfo?: string[]
  interviewHistory: InterviewSession[]
  totalInterviews: number
  bestScore: number
  averageScore: number
}

export interface InterviewQuestion {
  id: string
  question: string
  difficulty: "easy" | "medium" | "hard"
  timeLimit: number // in seconds
  category: string
  expectedKeywords: string[]
}

export interface Answer {
  questionId: string
  answer: string
  timeSpent: number
  score: number
  feedback: string
}

interface InterviewStore {
  candidates: Candidate[]
  currentCandidateId: string | null
  activeTab: "interviewee" | "interviewer"
  isLoading: boolean

  // Actions
  addCandidate: (candidate: Omit<Candidate, "id">) => string
  updateCandidate: (id: string, updates: Partial<Candidate>) => void
  setCurrentCandidate: (id: string | null) => void
  setActiveTab: (tab: "interviewee" | "interviewer") => void
  getCurrentCandidate: () => Candidate | null
  deleteCandidate: (id: string) => void
  updateLastActive: (id: string) => void
  getInactiveTime: (id: string) => number
  clearAllCandidates: () => void
  addInterviewSession: (candidateId: string, session: InterviewSession) => void
  updateInterviewStats: (candidateId: string) => void
  loadCandidatesFromSupabase: () => Promise<void>
  syncCandidateToSupabase: (candidate: Candidate) => Promise<void>
  syncCandidateOnResumeParse: (candidateId: string) => Promise<void>
  syncCandidateOnQuestionsGenerated: (candidateId: string) => Promise<void>
  syncCandidateOnInterviewCompleted: (candidateId: string) => Promise<void>
}

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      candidates: [],
      currentCandidateId: null,
      activeTab: "interviewee",
      isLoading: false,

      addCandidate: (candidateData) => {
        const id = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Get current user ID from localStorage
        let currentUserId = '';
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user.id;
          }
        } catch (error) {
          console.error('Failed to get current user ID:', error);
        }

        const candidate: Candidate = {
          ...candidateData,
          id,
          userId: currentUserId || candidateData.userId, // Ensure userId is set
          currentQuestion: 0,
          questions: [],
          answers: [],
          score: 0,
          summary: "",
          sessionId,
          lastActiveTime: new Date(),
          interviewHistory: [],
          totalInterviews: 0,
          bestScore: 0,
          averageScore: 0,
        }

        set((state) => ({
          candidates: [...state.candidates, candidate],
          currentCandidateId: id,
        }))

        return id
      },

      updateCandidate: (id, updates) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === id
              ? {
                  ...candidate,
                  ...updates,
                  lastActiveTime: new Date(),
                }
              : candidate,
          ),
        }))
      },

      setCurrentCandidate: (id) => {
        set({ currentCandidateId: id })
        if (id) {
          get().updateLastActive(id)
        }
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab })
      },

      getCurrentCandidate: () => {
        const state = get()
        return state.candidates.find((c) => c.id === state.currentCandidateId) || null
      },

      deleteCandidate: (id) => {
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
          currentCandidateId: state.currentCandidateId === id ? null : state.currentCandidateId,
        }))
      },

      updateLastActive: (id) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === id ? { ...candidate, lastActiveTime: new Date() } : candidate,
          ),
        }))
      },

      getInactiveTime: (id) => {
        const candidate = get().candidates.find((c) => c.id === id)
        if (!candidate?.lastActiveTime) return 0
        return Date.now() - new Date(candidate.lastActiveTime).getTime()
      },

      clearAllCandidates: () => {
        set({
          candidates: [],
          currentCandidateId: null,
        })
      },

      addInterviewSession: (candidateId, session) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? {
                  ...candidate,
                  interviewHistory: [...candidate.interviewHistory, session],
                  totalInterviews: candidate.totalInterviews + 1,
                }
              : candidate,
          ),
        }))
        get().updateInterviewStats(candidateId)
      },

      updateInterviewStats: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) => {
            if (candidate.id !== candidateId) return candidate

            const completedSessions = candidate.interviewHistory.filter(s => s.status === "completed")
            const scores = completedSessions.map(s => s.score)
            
            return {
              ...candidate,
              bestScore: scores.length > 0 ? Math.max(...scores) : 0,
              averageScore: scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
            }
          }),
        }))
      },

      loadCandidatesFromSupabase: async () => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error loading candidates:', error)
            return
          }

          if (data) {
            // Convert Supabase data to Candidate format
            const candidates: Candidate[] = data.map((row: any) => ({
              id: row.id,
              userId: row.user_id, // Link to users table
              name: row.name,
              email: row.email,
              phone: row.phone,
              resumeText: row.resume_text,
              status: row.status,
              currentQuestion: row.current_question || 0,
              questions: row.questions || [],
              answers: row.answers || [],
              score: row.score || 0,
              summary: row.summary || '',
              startTime: row.start_time ? new Date(row.start_time) : undefined,
              endTime: row.end_time ? new Date(row.end_time) : undefined,
              timeRemaining: row.time_remaining,
              profile: row.profile,
              skills: row.skills || [],
              experience: row.experience || [],
              education: row.education || [],
              missingInfo: row.missing_info || [],
              interviewHistory: row.interview_history || [],
              totalInterviews: row.total_interviews || 0,
              bestScore: row.best_score || 0,
              averageScore: row.average_score || 0,
              lastActiveTime: new Date(),
            }))

            set({ candidates })
          }
        } catch (error) {
          console.error('Error loading candidates from Supabase:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      syncCandidateToSupabase: async (candidate: Candidate) => {
        try {
          const candidateData = {
            id: candidate.id,
            user_id: candidate.userId, // Link to users table
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            resume_text: candidate.resumeText,
            status: candidate.status,
            profile: candidate.profile,
            skills: candidate.skills,
            experience: candidate.experience,
            education: candidate.education,
            missing_info: candidate.missingInfo,
            questions: candidate.questions,
            answers: candidate.answers,
            current_question: candidate.currentQuestion,
            score: candidate.score,
            summary: candidate.summary,
            start_time: candidate.startTime?.toISOString(),
            end_time: candidate.endTime?.toISOString(),
            time_remaining: candidate.timeRemaining,
            interview_history: candidate.interviewHistory,
            total_interviews: candidate.totalInterviews,
            best_score: candidate.bestScore,
            average_score: candidate.averageScore,
          }

          const { error } = await supabase
            .from('candidates')
            .upsert(candidateData, { onConflict: 'id' })

          if (error) {
            console.error('Error syncing candidate to Supabase:', error)
          }
        } catch (error) {
          console.error('Error syncing candidate to Supabase:', error)
        }
      },

      syncCandidateOnResumeParse: async (candidateId: string) => {
        const candidate = get().candidates.find(c => c.id === candidateId)
        if (candidate) {
          console.log('Syncing candidate to Supabase after resume parse')
          await get().syncCandidateToSupabase(candidate)
        }
      },

      syncCandidateOnQuestionsGenerated: async (candidateId: string) => {
        const candidate = get().candidates.find(c => c.id === candidateId)
        if (candidate) {
          console.log('Syncing candidate to Supabase after questions generated')
          await get().syncCandidateToSupabase(candidate)
        }
      },

      syncCandidateOnInterviewCompleted: async (candidateId: string) => {
        const candidate = get().candidates.find(c => c.id === candidateId)
        if (candidate) {
          console.log('Syncing candidate to Supabase after interview completed')
          await get().syncCandidateToSupabase(candidate)
        }
      },
    }),
    {
      name: "crisp-interview-storage",
      partialize: (state) => ({
        candidates: state.candidates,
        currentCandidateId: state.currentCandidateId,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            candidates:
              persistedState.candidates?.map((candidate: any) => ({
                ...candidate,
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                lastActiveTime: new Date(),
              })) || [],
          }
        }
        return persistedState
      },
    },
  ),
)
