"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useInterviewStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Eye, Trash2, Clock, Award, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react"

export default function InterviewerTab() {
  const router = useRouter()
  const { candidates, deleteCandidate, loadCandidatesFromSupabase, isLoading } = useInterviewStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("score")

  // Load candidates from Supabase when component mounts
  useEffect(() => {
    loadCandidatesFromSupabase()
  }, [loadCandidatesFromSupabase])

  const filteredCandidates = candidates
    .filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score
        case "name":
          return a.name.localeCompare(b.name)
        case "date":
          return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
        default:
          return 0
      }
    })

  const completedCandidates = candidates.filter((c) => c.status === "completed")
  const averageScore =
    completedCandidates.length > 0
      ? Math.round(completedCandidates.reduce((sum, c) => sum + c.score, 0) / completedCandidates.length)
      : 0

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "interviewing":
        return "In Progress"
      case "paused":
        return "Paused"
      case "info-collection":
        return "Collecting Info"
      default:
        return status
    }
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completedCandidates.length}</p>
                <p className="text-sm text-muted-foreground">Completed Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{averageScore}/100</p>
                <p className="text-sm text-muted-foreground">Average AI Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Interviewer Dashboard</h2>
          <p className="text-muted-foreground">Manage and review AI-powered candidate interviews</p>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Sort by Score</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading candidates from database...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No candidates found</h3>
            <p className="text-muted-foreground">
              {candidates.length === 0
                ? "No candidates have started interviews yet."
                : "No candidates match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {candidate.name || "Unnamed Candidate"}
                      {candidate.status === "completed" && <Sparkles className="h-4 w-4 text-primary" />}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>{candidate.email}</span>
                      {candidate.phone && <span>{candidate.phone}</span>}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(candidate.status)}>{getStatusText(candidate.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {candidate.status === "completed" && (
                      <div className="flex items-center gap-2">
                        {getScoreIcon(candidate.score)}
                        <span className={`font-medium ${getScoreColor(candidate.score)}`}>
                          Latest Score: {candidate.score}/100
                        </span>
                      </div>
                    )}
                    {candidate.status === "interviewing" && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Question {candidate.currentQuestion + 1}/6
                      </div>
                    )}
                    {candidate.totalInterviews > 0 && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>Interviews: {candidate.totalInterviews}</span>
                        {candidate.bestScore > 0 && (
                          <span className="text-green-600">Best: {candidate.bestScore}/100</span>
                        )}
                        {candidate.averageScore > 0 && (
                          <span className="text-blue-600">Avg: {candidate.averageScore}/100</span>
                        )}
                      </div>
                    )}
                    {candidate.startTime && <span>Started: {new Date(candidate.startTime).toLocaleDateString()}</span>}
                    {candidate.endTime && <span>Completed: {new Date(candidate.endTime).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/candidate/${candidate.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCandidate(candidate.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
