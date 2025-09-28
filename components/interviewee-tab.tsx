"use client"

import { useInterviewStore } from "@/lib/store"
import ResumeUpload from "@/components/resume-upload"
import InfoCollection from "@/components/info-collection"
import InterviewChat from "@/components/interview-chat"
import ProfileSelection from "@/components/profile-selection"

export default function IntervieweeTab() {
  const { getCurrentCandidate } = useInterviewStore()
  const currentCandidate = getCurrentCandidate()

  // No candidate - show resume upload
  if (!currentCandidate) {
    return <ResumeUpload />
  }

  // Candidate exists but missing info - show info collection
  if (currentCandidate.status === "info-collection") {
    return <InfoCollection candidate={currentCandidate} />
  }

  // Candidate needs to select profile
  if (currentCandidate.status === "interviewing" && !currentCandidate.profile) {
    return (
      <ProfileSelection 
        candidateId={currentCandidate.id}
        onComplete={() => {
          // Profile selected, questions will be generated automatically
        }}
      />
    )
  }

  // Ready for interview or in progress - show chat
  if (currentCandidate.status === "interviewing" || currentCandidate.status === "paused") {
    return <InterviewChat candidate={currentCandidate} />
  }

  // Interview completed - show the completion screen from InterviewChat
  if (currentCandidate.status === "completed") {
    return <InterviewChat candidate={currentCandidate} />
  }

  return <ResumeUpload />
}
