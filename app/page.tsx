"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInterviewStore } from "@/lib/store"
import IntervieweeTab from "@/components/interviewee-tab"
import InterviewerTab from "@/components/interviewer-tab"
import WelcomeBackModal from "@/components/welcome-back-modal"

export default function HomePage() {
  const { activeTab, setActiveTab } = useInterviewStore()

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(value:any) => setActiveTab(value as "interviewee" | "interviewer")}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="interviewee" className="text-sm">
              Interviewee
            </TabsTrigger>
            <TabsTrigger value="interviewer" className="text-sm">
              Interviewer Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interviewee" className="mt-0">
            <IntervieweeTab />
          </TabsContent>

          <TabsContent value="interviewer" className="mt-0">
            <InterviewerTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
