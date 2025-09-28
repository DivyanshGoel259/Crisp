"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInterviewStore, type Candidate } from "@/lib/store"

interface InfoCollectionProps {
  candidate: Candidate
}

export default function InfoCollection({ candidate }: InfoCollectionProps) {
  const [name, setName] = useState(candidate.name)
  const [email, setEmail] = useState(candidate.email)
  const [phone, setPhone] = useState(candidate.phone)
  const [skills, setSkills] = useState(candidate.skills?.join(", ") || "")
  const [experience, setExperience] = useState(candidate.experience?.join("\n") || "")
  const [education, setEducation] = useState(candidate.education?.join("\n") || "")
  const { updateCandidate } = useInterviewStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (name.trim() && email.trim() && phone.trim()) {
      updateCandidate(candidate.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        skills: skills.trim() ? skills.split(",").map(s => s.trim()).filter(s => s) : [],
        experience: experience.trim() ? experience.split("\n").filter(e => e.trim()) : [],
        education: education.trim() ? education.split("\n").filter(e => e.trim()) : [],
        status: "interviewing",
        startTime: new Date(),
      })
    }
  }

  const isValid = name.trim() && email.trim() && phone.trim()
  const missingFields = candidate.missingInfo || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-balance">Complete Your Information</h2>
        <p className="text-muted-foreground text-lg text-balance">
          We need a few more details before starting your interview
        </p>
        {missingFields.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Missing information detected:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {missingFields.map((field, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            Personal Information
          </CardTitle>
          <CardDescription>Please fill in any missing information from your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <span>👤</span>
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <span>📧</span>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <span>📱</span>
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            {missingFields.includes("skills") && (
              <div className="space-y-2">
                <Label htmlFor="skills" className="flex items-center gap-2">
                  <span>🛠️</span>
                  Skills
                </Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder="JavaScript, React, Node.js, etc."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">Separate skills with commas</p>
              </div>
            )}

            {missingFields.includes("experience") && (
              <div className="space-y-2">
                <Label htmlFor="experience" className="flex items-center gap-2">
                  <span>💼</span>
                  Work Experience
                </Label>
                <Textarea
                  id="experience"
                  placeholder="Describe your work experience..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="bg-background min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">One experience per line</p>
              </div>
            )}

            {missingFields.includes("education") && (
              <div className="space-y-2">
                <Label htmlFor="education" className="flex items-center gap-2">
                  <span>🎓</span>
                  Education
                </Label>
                <Textarea
                  id="education"
                  placeholder="List your educational background..."
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="bg-background min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">One degree/certification per line</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isValid}>
              Start Interview
              <span className="ml-2">→</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
