"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useInterviewStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import IntervieweeTab from "@/components/interviewee-tab"
import InterviewerTab from "@/components/interviewer-tab"
import WelcomeBackModal from "@/components/welcome-back-modal"
import { LogOut, User } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { activeTab, setActiveTab } = useInterviewStore()
  const { user, isAuthenticated, isLoading, initializeAuth, signOut } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Set initial tab based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'interviewer') {
        setActiveTab('interviewer')
      } else if (user.role === 'interviewee') {
        setActiveTab('interviewee')
      }
    }
  }, [user, setActiveTab])

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSignOut = () => {
    signOut()
    if (typeof window !== 'undefined') {
      window.location.href = '/signin'
    }
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <WelcomeBackModal />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Crisp</h1>
              <span className="text-muted-foreground text-sm">AI Interview Assistant</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.name} ({user.role})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value:any) => setActiveTab(value as "interviewee" | "interviewer")}>
          <TabsList className={`grid w-full max-w-md mx-auto mb-8 ${user.role === 'interviewer' ? 'grid-cols-1' : 'grid-cols-1'}`}>
            {user.role === 'interviewee' && (
              <TabsTrigger value="interviewee" className="text-sm">
                Interviewee
              </TabsTrigger>
            )}
            {user.role === 'interviewer' && (
              <TabsTrigger value="interviewer" className="text-sm">
                Interviewer Dashboard
              </TabsTrigger>
            )}
          </TabsList>

          {user.role === 'interviewee' && (
            <TabsContent value="interviewee" className="mt-0">
              <IntervieweeTab />
            </TabsContent>
          )}

          {user.role === 'interviewer' && (
            <TabsContent value="interviewer" className="mt-0">
              <InterviewerTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
