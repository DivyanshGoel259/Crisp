"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useInterviewStore } from "@/lib/store"
import { Clock, User, Sparkles, Play, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function WelcomeBackModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false)
  const { candidates, setCurrentCandidate, setActiveTab, deleteCandidate } = useInterviewStore()

  useEffect(() => {
    // Only check for unfinished sessions on initial page load, not on every candidate update
    if (!hasCheckedOnMount) {
      const unfinishedCandidate = candidates.find(
        (c) => {
          // Only show modal for candidates who have actually started (not just uploaded)
          return (c.status === "paused" || c.status === "interviewing") && 
                 (c.currentQuestion > 0 || c.answers.length > 0 || c.startTime)
        }
      )

      if (unfinishedCandidate) {
        setIsOpen(true)
      }
      setHasCheckedOnMount(true)
    }
  }, [candidates, hasCheckedOnMount])

  const handleContinue = () => {
    const unfinishedCandidate = candidates.find(
      (c) => {
        return (c.status === "paused" || c.status === "interviewing") && 
               (c.currentQuestion > 0 || c.answers.length > 0 || c.startTime)
      }
    )

    if (unfinishedCandidate) {
      setCurrentCandidate(unfinishedCandidate.id)
      setActiveTab("interviewee")
    }
    setIsOpen(false)
  }

  const handleStartNew = () => {
    // Clean up any unfinished sessions
    const unfinishedCandidates = candidates.filter(
      (c) => {
        return (c.status === "paused" || c.status === "interviewing") && 
               (c.currentQuestion > 0 || c.answers.length > 0 || c.startTime)
      }
    )

    unfinishedCandidates.forEach((candidate) => {
      deleteCandidate(candidate.id)
    })

    setCurrentCandidate(null)
    setActiveTab("interviewee")
    setIsOpen(false)
  }

  const unfinishedCandidate = candidates.find(
    (c) => {
      return (c.status === "paused" || c.status === "interviewing") && 
             (c.currentQuestion > 0 || c.answers.length > 0 || c.startTime)
    }
  )

  if (!unfinishedCandidate) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "info-collection":
        return {
          text: "Collecting Information",
          color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
          description: "Complete your profile to start the interview",
        }
      case "interviewing":
        return {
          text: "Interview in Progress",
          color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          description: `Question ${unfinishedCandidate.currentQuestion + 1} of 6`,
        }
      case "paused":
        return {
          text: "Interview Paused",
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          description: `Paused at question ${unfinishedCandidate.currentQuestion + 1} of 6`,
        }
      default:
        return {
          text: "Unknown Status",
          color: "bg-muted text-muted-foreground",
          description: "",
        }
    }
  }

  const statusInfo = getStatusInfo(unfinishedCandidate.status)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Welcome Back to Crisp!
          </DialogTitle>
          <DialogDescription className="text-base">
            You have an unfinished interview session. Would you like to continue where you left off or start fresh?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-card border border-border rounded-lg p-6 my-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{unfinishedCandidate.name || "Unnamed Candidate"}</h3>
                <p className="text-sm text-muted-foreground">{unfinishedCandidate.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
              </div>

              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>

              {unfinishedCandidate.startTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Started: {new Date(unfinishedCandidate.startTime).toLocaleString()}</span>
                </div>
              )}

              {unfinishedCandidate.timeRemaining && unfinishedCandidate.timeRemaining > 0 && (
                <div className="text-xs text-muted-foreground">
                  Time remaining on current question: {Math.floor(unfinishedCandidate.timeRemaining / 60)}:
                  {(unfinishedCandidate.timeRemaining % 60).toString().padStart(2, "0")}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleStartNew} className="flex-1 bg-transparent">
            <RotateCcw className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Continue Session
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Starting a new session will permanently delete your current progress.
        </p>
      </DialogContent>
    </Dialog>
  )
}
