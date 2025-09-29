"use client"

import { useParams, useRouter } from "next/navigation"
import { useInterviewStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Clock, Award, MessageSquare, Sparkles, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react"

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { candidates } = useInterviewStore()
  const { user, isAuthenticated } = useAuthStore()
  const candidateId = params.id as string
  const candidate = candidates.find((c) => c.id === candidateId)

  // Redirect if not authenticated or not interviewer
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'interviewer') {
      router.push('/signin')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'interviewer') {
    return null
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Candidate Not Found</h1>
          <p className="text-muted-foreground mb-6">The candidate you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "interviewing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "info-collection":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 6) return <Minus className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500"
    if (score >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const progress = candidate.questions.length > 0 ? (candidate.answers.length / candidate.questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{candidate.name || "Unnamed Candidate"}</h1>
              </div>
            </div>
            <Badge className={getStatusColor(candidate.status)}>
              {candidate.status === "completed"
                ? "Completed"
                : candidate.status === "interviewing"
                  ? "In Progress"
                  : candidate.status === "paused"
                    ? "Paused"
                    : "Collecting Info"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Personal Information */}
          <div className="border rounded-lg bg-card">
            <div className="p-6 border-b">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <User className="h-5 w-5" />
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{candidate.phone}</p>
                  </div>
                </div>
                {candidate.startTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">{new Date(candidate.startTime).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {candidate.endTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium">{new Date(candidate.endTime).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interview Progress */}
          {candidate.status !== "info-collection" && (
            <div className="border rounded-lg bg-card">
              <div className="p-6 border-b">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Award className="h-5 w-5" />
                  AI Interview Analysis
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Interview Progress</span>
                      <span className="text-muted-foreground">
                        {candidate.answers.length}/{candidate.questions.length} questions
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  {/* Score and Summary */}
                  {candidate.status === "completed" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="text-center p-8 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                            <span className="text-lg font-medium text-primary">AI Overall Score</span>
                          </div>
                          <div className="text-6xl font-bold text-primary mb-2">{candidate.score}</div>
                          <div className="text-lg text-muted-foreground">out of 100</div>
                        </div>
                      </div>

                      {candidate.summary && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Summary
                          </h3>
                          <div className="text-muted-foreground bg-muted p-6 rounded-lg leading-relaxed">
                            <p className="break-words overflow-wrap-anywhere">{candidate.summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Interview History */}
          {candidate.interviewHistory && candidate.interviewHistory.length > 0 && (
            <div className="border rounded-lg bg-card">
              <div className="p-6 border-b">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Award className="h-5 w-5" />
                  Interview History ({candidate.totalInterviews} total)
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {candidate.interviewHistory.map((session, index) => (
                    <div key={session.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Session {index + 1}</Badge>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status === "completed" ? "Completed" : "Incomplete"}
                          </Badge>
                          {session.profile && (
                            <Badge variant="secondary" className="text-xs">
                              {session.profile === "fullstack-node" ? "Full Stack" : "React"}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{new Date(session.startTime).toLocaleDateString()}</div>
                          {session.endTime && (
                            <div>Duration: {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min</div>
                          )}
                        </div>
                      </div>
                      
                      {session.status === "completed" && (
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            {getScoreIcon(session.score)}
                            <span className={`font-medium ${getScoreColor(session.score)}`}>
                              Score: {session.score}/100
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.answers.length}/6 questions answered
                          </div>
                        </div>
                      )}
                      
                      {session.summary && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">{session.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Interview Questions and Answers */}
          {candidate.questions.length > 0 && (
            <div className="border rounded-lg bg-card">
              <div className="p-6 border-b">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <MessageSquare className="h-5 w-5" />
                  Current Interview Questions & AI Evaluation
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {candidate.questions.map((question, index) => {
                    const answer = candidate.answers.find((a) => a.questionId === question.id)
                    return (
                      <div key={question.id} className="border-l-4 border-primary/20 pl-8 relative">
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-bold">{index + 1}</span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                              {question.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(question.timeLimit / 60)}:
                              {(question.timeLimit % 60).toString().padStart(2, "0")} allowed
                            </span>
                          </div>

                          <h3 className="text-lg font-medium leading-relaxed break-words">{question.question}</h3>

                          {answer ? (
                            <div className="space-y-4">
                              <div className="bg-muted p-6 rounded-lg">
                                <p className="leading-relaxed mb-4 break-words overflow-wrap-anywhere">{answer.answer}</p>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                  <span>Time: {answer.timeSpent}s</span>
                                  <div className="flex items-center gap-2">
                                    {getScoreIcon(answer.score)}
                                    <span className={`font-medium ${getScoreColor(answer.score)}`}>
                                      AI Score: {answer.score}/10
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {answer.feedback && (
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary">AI Feedback</span>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">{answer.feedback}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic bg-muted/50 p-4 rounded-lg">
                              Not answered yet
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Resume Text */}
          {candidate.resumeText && (
            <div className="border rounded-lg bg-card">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Resume Content</h2>
                <p className="text-muted-foreground mt-2">Extracted text from uploaded resume (processed by AI)</p>
              </div>
              <div className="p-6">
                <pre className="bg-muted p-6 rounded-lg whitespace-pre-wrap overflow-auto max-h-80 leading-relaxed break-words">
                  {candidate.resumeText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
