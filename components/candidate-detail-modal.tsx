"use client"

import { useInterviewStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Phone, Clock, Award, MessageSquare, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CandidateDetailModalProps {
  candidateId: string
  isOpen: boolean
  onClose: () => void
}

export default function CandidateDetailModal({ candidateId, isOpen, onClose }: CandidateDetailModalProps) {
  const { candidates } = useInterviewStore()
  const candidate = candidates.find((c) => c.id === candidateId)

  if (!candidate) return null

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>{candidate.name || "Unnamed Candidate"}</span>
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
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] ">
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.phone}</span>
                  </div>
                  {candidate.startTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Started: {new Date(candidate.startTime).toLocaleString()}</span>
                    </div>
                  )}
                  {candidate.endTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Completed: {new Date(candidate.endTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interview Progress */}
            {candidate.status !== "info-collection" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    AI Interview Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Interview Progress</span>
                        <span>
                          {candidate.answers.length}/{candidate.questions.length} questions
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Score and Summary */}
                    {candidate.status === "completed" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Sparkles className="h-6 w-6 text-primary" />
                              <span className="text-sm font-medium text-primary">AI Overall Score</span>
                            </div>
                            <div className="text-4xl font-bold text-primary mb-1">{candidate.score}</div>
                            <div className="text-sm text-muted-foreground">out of 100</div>
                          </div>
                        </div>

                        {candidate.summary && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              AI Summary
                            </h4>
                            <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg leading-relaxed">
                              {candidate.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview History */}
            {candidate.interviewHistory && candidate.interviewHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Interview History ({candidate.totalInterviews} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidate.interviewHistory.map((session, index) => (
                      <div key={session.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
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
                          <div className="flex items-center gap-4">
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
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground leading-relaxed">{session.summary}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Interview Questions and Answers */}
            {candidate.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Current Interview Questions & AI Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {candidate.questions.map((question, index) => {
                      const answer = candidate.answers.find((a) => a.questionId === question.id)
                      return (
                        <div key={question.id} className="border-l-2 border-primary/20 pl-6 relative">
                          <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground font-bold">{index + 1}</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                                {question.difficulty}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {question.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(question.timeLimit / 60)}:
                                {(question.timeLimit % 60).toString().padStart(2, "0")} allowed
                              </span>
                            </div>

                            <h4 className="font-medium text-sm leading-relaxed">{question.question}</h4>

                            {answer ? (
                              <div className="space-y-3">
                                <div className="bg-muted p-4 rounded-lg">
                                  <p className="text-sm leading-relaxed mb-3">{answer.answer}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Time: {answer.timeSpent}s</span>
                                    <div className="flex items-center gap-1">
                                      {getScoreIcon(answer.score)}
                                      <span className={`font-medium ${getScoreColor(answer.score)}`}>
                                        AI Score: {answer.score}/10
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {answer.feedback && (
                                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="h-3 w-3 text-primary" />
                                      <span className="text-xs font-medium text-primary">AI Feedback</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{answer.feedback}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic bg-muted/50 p-3 rounded-lg">
                                Not answered yet
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resume Text */}
            {candidate.resumeText && (
              <Card>
                <CardHeader>
                  <CardTitle>Resume Content</CardTitle>
                  <CardDescription>Extracted text from uploaded resume (processed by AI)</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap overflow-auto max-h-60 leading-relaxed">
                    {candidate.resumeText}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
