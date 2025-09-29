"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useInterviewStore, type Candidate } from "@/lib/store"
import { useTimer } from "@/hooks/use-timer"
import { aiService } from "@/lib/ai-service"
import { Clock, Send, Pause, Play, Bot, User, AlertTriangle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InterviewChatProps {
  candidate: Candidate
}

export default function InterviewChat({ candidate }: InterviewChatProps) {
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false) // Track initialization state
  const { updateCandidate, addInterviewSession, syncCandidateOnQuestionsGenerated, syncCandidateOnInterviewCompleted } = useInterviewStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializationRef = useRef<string | null>(null) // Track which candidate we've initialized

  const currentQuestion = candidate.questions[candidate.currentQuestion]
  const progress = ((candidate.currentQuestion + 1) / 6) * 100

  const { timeRemaining, isRunning, isPaused, startTimer, pauseTimer, resumeTimer, resetTimer, formatTime } = useTimer({
    initialTime: currentQuestion?.timeLimit || 0,
    onTimeUp: () => handleSubmitAnswer(true),
    autoStart: false,
  })

  // FIXED: Better condition to prevent double initialization
  useEffect(() => {
    const shouldInitialize = candidate.id && 
                            candidate.questions.length === 0 && 
                            initializationRef.current !== candidate.id &&
                            !isInitializing

    if (shouldInitialize) {
      console.log("[v0] Initializing questions for candidate:", candidate.id)
      initializationRef.current = candidate.id
      initializeQuestions()
    }
  }, [candidate.id, candidate.questions.length]) // More specific dependencies

  useEffect(() => {
    if (currentQuestion && candidate.status === "interviewing") {
      resetTimer(candidate.timeRemaining || currentQuestion.timeLimit)
      startTimer()
    }
  }, [candidate.currentQuestion, currentQuestion, candidate.status])

  useEffect(() => {
    if (candidate.status === "paused" && isRunning) {
      pauseTimer()
    } else if (candidate.status === "interviewing" && isPaused) {
      resumeTimer()
    }
  }, [candidate.status])

  useEffect(() => {
    if (currentQuestion && candidate.status === "interviewing") {
      updateCandidate(candidate.id, { timeRemaining })
    }
  }, [timeRemaining, candidate.status])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [candidate.questions, candidate.answers])

  // Stop timer and cleanup effects when interview is completed
  useEffect(() => {
    if (candidate.status === "completed") {
      resetTimer(0)
      setIsEvaluating(false)
    }
  }, [candidate.status, resetTimer])

  const initializeQuestions = async () => {
    if (isInitializing) {
      console.log("[v0] Already initializing questions, skipping...")
      return
    }

    // Don't initialize if interview is already completed
    if (candidate.status === "completed") {
      console.log("[v0] Interview already completed, skipping initialization...")
      return
    }

    setIsInitializing(true)
    console.log("[v0] Starting question initialization...")

    try {
      // Use already parsed candidate information instead of re-parsing
      const candidateInfo = {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        skills: candidate.skills || [],
        experience: candidate.experience || [],
        education: candidate.education || [],
        missingInfo: candidate.missingInfo || []
      }
      
      const questions = await aiService.generateInterviewQuestions(candidateInfo, candidate.profile || "fullstack-node")
      
      console.log("[v0] Generated questions:", questions.length)
      updateCandidate(candidate.id, { questions })
      
      // Sync to Supabase after questions are generated
      await syncCandidateOnQuestionsGenerated(candidate.id)
      
    } catch (error) {
      console.error("[v0] Question generation error:", error)
      
      // Show error state instead of fallback questions
      throw new Error("Failed to generate interview questions. Please try again.")
    } finally {
      setIsInitializing(false)
      console.log("[v0] Question initialization completed")
    }
  }

  const handleSubmitAnswer = async (isTimeUp = false) => {
    if (!currentQuestion) return

    setIsEvaluating(true)

    try {
      const answerText = currentAnswer.trim() || (isTimeUp ? "No answer provided (time expired)" : "")
      const timeSpent = currentQuestion.timeLimit - timeRemaining

      const evaluation = await aiService.evaluateAnswer(currentQuestion, answerText, timeSpent)

      const answer = {
        questionId: currentQuestion.id,
        answer: answerText,
        timeSpent,
        score: evaluation.score,
        feedback: evaluation.feedback,
      }

      const newAnswers = [...candidate.answers, answer]
      const nextQuestion = candidate.currentQuestion + 1

      if (nextQuestion >= 6) {
        // Use already parsed candidate information instead of re-parsing
        const candidateInfo = {
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          skills: candidate.skills || [],
          experience: candidate.experience || [],
          education: candidate.education || [],
          missingInfo: candidate.missingInfo || []
        }
        const summary = await aiService.generateInterviewSummary(candidateInfo, candidate.questions, newAnswers)

        // Save current interview to history
        const interviewSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          questions: candidate.questions,
          answers: newAnswers,
          score: summary.overallScore,
          summary: summary.summary,
          startTime: candidate.startTime || new Date(),
          endTime: new Date(),
          status: "completed" as const,
          profile: candidate.profile,
        }
        
        addInterviewSession(candidate.id, interviewSession)

        updateCandidate(candidate.id, {
          answers: newAnswers,
          status: "completed",
          endTime: new Date(),
          score: summary.overallScore,
          summary: summary.summary,
          timeRemaining: 0,
        })

        // Sync to Supabase after interview completion
        await syncCandidateOnInterviewCompleted(candidate.id)
      } else {
        // Move to next question
        updateCandidate(candidate.id, {
          answers: newAnswers,
          currentQuestion: nextQuestion,
          timeRemaining: 0,
        })
      }

      setCurrentAnswer("")
    } catch (error) {
      console.error("[v0] Answer evaluation error:", error)
      throw new Error("Failed to evaluate answer. Please try again.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const handlePause = () => {
    const newStatus = candidate.status === "paused" ? "interviewing" : "paused"
    updateCandidate(candidate.id, {
      status: newStatus,
      timeRemaining: timeRemaining,
    })
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

  // Show loading state during initialization
  if (!currentQuestion && isInitializing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="text-lg font-medium">AI is generating your personalized interview questions...</p>
            <p className="text-muted-foreground mt-2">This may take a few moments</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show completion screen
  if (candidate.status === "completed") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Interview Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{candidate.score}/100</div>
              <p className="text-lg text-muted-foreground">Overall Score</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Interview Summary</h3>
              <p className="text-sm text-muted-foreground">{candidate.summary}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => {
                  updateCandidate(candidate.id, { status: "uploading" })
                }}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if no questions and not initializing
  if (!currentQuestion && !isInitializing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-lg font-medium">Failed to load interview questions</p>
            <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
            <Button 
              onClick={() => {
                initializationRef.current = null
                initializeQuestions()
              }} 
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Interview in Progress
          </h2>
          <p className="text-muted-foreground">Question {candidate.currentQuestion + 1} of 6</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className={`text-2xl font-mono font-bold ${timeRemaining <= 30 ? "text-destructive" : "text-primary"}`}
            >
              {formatTime()}
            </div>
            <div className="text-xs text-muted-foreground">Time Remaining</div>
          </div>
          <Button variant="outline" onClick={handlePause} disabled={isEvaluating}>
            {candidate.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {timeRemaining <= 30 && timeRemaining > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: Only {timeRemaining} seconds remaining! Your answer will be auto-submitted when time runs out.
          </AlertDescription>
        </Alert>
      )}

      {candidate.status === "paused" && (
        <Alert>
          <Pause className="h-4 w-4" />
          <AlertDescription>Interview is paused. Click the play button to resume the timer.</AlertDescription>
        </Alert>
      )}

      {isEvaluating && (
        <Alert>
          <Sparkles className="h-4 w-4 animate-pulse" />
          <AlertDescription>AI is evaluating your answer and preparing the next question...</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{candidate.currentQuestion + 1}/6 questions</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Chat Messages */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Interview Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Previous Q&A */}
          {candidate.answers.map((answer, index) => {
            const question = candidate.questions[index]
            return (
              <div key={answer.questionId} className="space-y-3 pb-4 border-b border-border last:border-b-0">
                <div className="flex items-start gap-3">
                  <Bot className="h-6 w-6 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDifficultyColor(question?.difficulty)}>{question?.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground">{question?.category}</span>
                    </div>
                    <p className="text-sm">{question?.question}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-6 w-6 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <p className="text-sm bg-muted p-3 rounded-lg">{answer?.answer}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Time: {answer.timeSpent}s</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Score: {answer?.score}/10
                      </span>
                    </div>
                    {answer.feedback && (
                      <p className="text-xs text-primary/80 mt-2 italic bg-primary/5 p-2 rounded">
                        AI Feedback: {answer?.feedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Current Question */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-primary mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getDifficultyColor(currentQuestion?.difficulty)}>{currentQuestion?.difficulty}</Badge>
                  <span className="text-xs text-muted-foreground">{currentQuestion?.category}</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(currentQuestion?.timeLimit / 60)}:
                    {(currentQuestion?.timeLimit % 60).toString().padStart(2, "0")} allowed
                  </span>
                </div>
                <p className="text-sm font-medium">{currentQuestion?.question}</p>
              </div>
            </div>

            {/* Answer Input */}
            <div className="flex items-start gap-3">
              <User className="h-6 w-6 text-muted-foreground mt-1" />
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[100px] bg-background"
                  disabled={candidate.status === "paused" || isEvaluating}
                />
                <Button
                  onClick={() => handleSubmitAnswer()}
                  disabled={candidate.status === "paused" || !currentAnswer.trim() || isEvaluating}
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      AI Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>
    </div>
  )
}