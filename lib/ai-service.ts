import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Answer, InterviewQuestion } from './store'

export interface ResumeParsingResult {
  name: string
  email: string
  phone: string
  skills: string[]
  experience: string[]
  education: string[]
  missingInfo: string[]
}

export interface AnswerEvaluation {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface InterviewSummary {
  overallScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendation: "hire" | "maybe" | "no-hire"
}

export class AIService {
  private static instance: AIService
  private genAI: GoogleGenerativeAI

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Missing Gemini API key')
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async parsePDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      // Convert PDF to base64 for Gemini
      const base64 = btoa(String.fromCharCode(...uint8Array))
      
      const prompt = "Extract all text content from this PDF file. Return only the plain text without any formatting."
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: "application/pdf"
          }
        }
      ])
      
      return result.response.text()
    } catch (error) {
      console.error("[v0] PDF parsing error:", error)
      throw new Error("Failed to parse PDF file")
    }
  }

  async parseResume(resumeText: string): Promise<ResumeParsingResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      const prompt = `
        Parse the following resume text and extract the candidate's information in JSON format.
        Return only valid JSON with the following structure:
        {
          "name": "Full Name",
          "email": "email@example.com", 
          "phone": "+1234567890",
          "skills": ["skill1", "skill2"],
          "experience": ["job1 description", "job2 description"],
          "education": ["degree1", "degree2"],
          "missingInfo": ["field1", "field2"]
        }

        Rules:
        - If any field is not found, use an empty string for name/email/phone or empty array for others
        - For missingInfo, list fields that are missing or incomplete (e.g., ["phone", "skills", "experience"])
        - Extract skills from experience descriptions if not explicitly listed
        - Be thorough in extracting all available information

        Resume text:
        ${resumeText}
      `
      
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Clean the response text to extract JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanedText)
      
      return {
        name: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        missingInfo: parsed.missingInfo || []
      }
    } catch (error) {
      console.error("[v0] Resume parsing error:", error)
      // Fallback to regex parsing
      return this.fallbackResumeParser(resumeText)
    }
  }

  private fallbackResumeParser(resumeText: string): ResumeParsingResult {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    const phoneRegex = /\+?1?\s*\(?[0-9]{3}\)?[-.\s]*[0-9]{3}[-.\s]*[0-9]{4}/

    const email = resumeText.match(emailRegex)?.[0] || ""
    const phone = resumeText.match(phoneRegex)?.[0] || ""

    const lines = resumeText.split("\n").filter((line) => line.trim())
    const name = lines[0]?.trim() || ""

    return {
      name,
      email,
      phone,
      skills: [],
      experience: [],
      education: [],
      missingInfo: ["skills", "experience", "education"]
    }
  }

  async generateInterviewQuestions(candidateInfo: ResumeParsingResult, profile: "fullstack-node" | "react" = "fullstack-node"): Promise<InterviewQuestion[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      const profileFocus = profile === "fullstack-node" 
        ? "Full-stack development with Node.js, Express, MongoDB/PostgreSQL, and React frontend"
        : "React frontend development with modern libraries, state management, and UI/UX"
      
      const prompt = `
        Generate 6 technical interview questions for a ${profile} position based on the candidate's background.
        
        Candidate Info:
        - Name: ${candidateInfo.name}
        - Skills: ${candidateInfo.skills.join(", ")}
        - Experience: ${candidateInfo.experience.join("; ")}
        - Education: ${candidateInfo.education.join("; ")}
        
        Profile Focus: ${profileFocus}
        
        Requirements:
        - 2 Easy questions (90-120 seconds each) - Basic concepts and fundamentals
        - 2 Medium questions (180-240 seconds each) - Practical application and problem-solving
        - 2 Hard questions (300-360 seconds each) - Complex scenarios and architecture
        - Questions should build upon each other and test progressive understanding
        - Include practical scenarios relevant to the candidate's experience
        - Make questions specific to ${profile} role
        
        Return JSON array with this structure:
        [
          {
            "id": "q1",
            "question": "Question text here",
            "difficulty": "easy|medium|hard",
            "timeLimit": 120,
            "category": "Category name",
            "expectedKeywords": ["keyword1", "keyword2"]
          }
        ]
      `
      
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Clean the response text to extract JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const questions = JSON.parse(cleanedText)
      console.log("[v0] Questions:", questions)
      
      return questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
      }))
    } catch (error) {
      console.error("[v0] Question generation error:", error)
      throw new Error("Failed to generate interview questions. Please try again.")
    }
  }

  async evaluateAnswer(question: InterviewQuestion, answer: string, timeSpent: number, previousAnswers: Answer[] = []): Promise<AnswerEvaluation> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      const previousContext = previousAnswers.length > 0 
        ? `Previous answers for context: ${previousAnswers.map(a => `Q: ${a.questionId} - A: ${a.answer.substring(0, 100)}...`).join("; ")}`
        : ""
      
      const prompt = `
        Evaluate this interview answer on a scale of 1-10.
        
        Question: ${question.question}
        Difficulty: ${question.difficulty}
        Expected Keywords: ${question.expectedKeywords.join(", ")}
        Time Limit: ${question.timeLimit} seconds
        Time Spent: ${timeSpent} seconds
        
        Answer: ${answer}
        
        ${previousContext}
        
        Consider:
        - Technical accuracy and depth
        - Completeness of answer
        - Use of relevant keywords and concepts
        - Time management
        - Communication clarity
        - How this answer builds on or relates to previous responses
        - Practical application of knowledge
        
        Return JSON:
        {
          "score": 8,
          "feedback": "Detailed feedback here with specific suggestions",
          "strengths": ["strength1", "strength2"],
          "improvements": ["improvement1", "improvement2"]
        }
      `
      
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Clean the response text to extract JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("[v0] Answer evaluation error:", error)
      throw new Error("Failed to evaluate answer. Please try again.")
    }
  }

  async generateInterviewSummary(
    candidateInfo: ResumeParsingResult,
    questions: InterviewQuestion[],
    answers: { questionId: string; answer: string; score: number; timeSpent: number }[],
  ): Promise<InterviewSummary> {
    try {
      const averageScore = answers.reduce((sum, a) => sum + a.score, 0) / answers.length
      const overallScore = Math.round(averageScore * 10)

      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
      
      const prompt = `
        Generate a comprehensive interview summary for this candidate.
        
        Candidate: ${candidateInfo.name}
        Skills: ${candidateInfo.skills.join(", ")}
        Experience: ${candidateInfo.experience.join("; ")}
        
        Interview Performance:
        ${questions
          .map((q, i) => {
            const answer = answers.find((a) => a.questionId === q.id)
            return `
          Q${i + 1} (${q.difficulty}): ${q.question}
          Answer: ${answer?.answer || "No answer"}
          Score: ${answer?.score || 0}/10
          Time: ${answer?.timeSpent || 0}s
          `
          })
          .join("\n")}
        
        Average Score: ${averageScore.toFixed(1)}/10
        
        Provide a JSON response:
        {
          "overallScore": ${overallScore},
          "summary": "2-3 sentence summary of performance with specific insights",
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "recommendation": "hire|maybe|no-hire"
        }
      `
      
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      // Clean the response text to extract JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("[v0] Summary generation error:", error)
      throw new Error("Failed to generate interview summary. Please try again.")
    }
  }
}

export const aiService = AIService.getInstance()
