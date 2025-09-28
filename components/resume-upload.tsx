"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useInterviewStore } from "@/lib/store"
import { aiService } from "@/lib/ai-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResumeUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addCandidate, clearAllCandidates, syncCandidateOnResumeParse } = useInterviewStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploading(true)
      setError(null)

      try {
        // Clear any existing candidates when starting fresh
        clearAllCandidates()
        
        // Extract text from resume
        const resumeText = file.type === "application/pdf" 
          ? await aiService.parsePDF(file)
          : await extractTextFromFile(file)

        const candidateInfo = await aiService.parseResume(resumeText)

        // Determine if we need to collect additional information
        const hasBasicInfo = candidateInfo.name && candidateInfo.email && candidateInfo.phone
        const hasMissingInfo = candidateInfo.missingInfo && candidateInfo.missingInfo.length > 0
        
        // Create candidate with extracted info
        const candidateId = addCandidate({
          name: candidateInfo.name || "",
          email: candidateInfo.email || "",
          phone: candidateInfo.phone || "",
          resumeFile: file,
          resumeText,
          status: hasBasicInfo && !hasMissingInfo ? "interviewing" : "info-collection",
          currentQuestion: 0,
          summary: "",
          answers: [],
          score: 0,
          questions: [],
          skills: candidateInfo.skills,
          experience: candidateInfo.experience,
          education: candidateInfo.education,
          missingInfo: candidateInfo.missingInfo,
          interviewHistory: [],
          totalInterviews: 0,
          bestScore: 0,
          averageScore: 0,
        })

        console.log("[v0] Created candidate:", candidateId, candidateInfo)
        
        // Sync to Supabase after resume parsing
        await syncCandidateOnResumeParse(candidateId)
      } catch (err) {
        console.error("[v0] Resume upload error:", err)
        setError("Failed to process resume. Please try again or upload a different file.")
      } finally {
        setIsUploading(false)
      }
    },
    [addCandidate],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-balance">Welcome to Crisp</h2>
        <p className="text-muted-foreground text-lg text-balance">
          Upload your resume to begin the AI-powered interview process
        </p>
      </div>

      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume in PDF format. Our AI will extract your information and generate personalized
            interview questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              {isUploading ? <div className="text-4xl animate-pulse">⏳</div> : <div className="text-4xl">⬆️</div>}

              <div>
                {isUploading ? (
                  <p className="text-lg font-medium">Processing your resume with AI...</p>
                ) : isDragActive ? (
                  <p className="text-lg font-medium">Drop your resume here</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-1">Drag & drop your resume here</p>
                    <p className="text-muted-foreground">or click to browse files</p>
                  </>
                )}
              </div>

              {!isUploading && (
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <span className="text-lg">⚠️</span>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-sm text-muted-foreground">
            <p className="font-medium mb-2">What our AI does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Extracts your personal information automatically</li>
              <li>Analyzes your skills and experience</li>
              <li>Generates personalized interview questions</li>
              <li>Provides real-time scoring and feedback</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to extract text from uploaded file
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer

        if (file.type === "application/pdf") {
          const text = await aiService.parsePDF(file)
          resolve(text)
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          reject(new Error("DOCX files are not supported. Please upload a PDF file."))
        } else {
          reject(new Error("Unsupported file type. Please upload a PDF file."))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}