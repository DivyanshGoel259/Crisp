"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInterviewStore } from "@/lib/store"
import { Code, Globe, Database, Layers, Zap, Palette } from "lucide-react"

interface ProfileSelectionProps {
  candidateId: string
  onComplete: () => void
}

export default function ProfileSelection({ candidateId, onComplete }: ProfileSelectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<"fullstack-node" | "react" | null>(null)
  const { updateCandidate } = useInterviewStore()

  const handleProfileSelect = (profile: "fullstack-node" | "react") => {
    setSelectedProfile(profile)
    updateCandidate(candidateId, { profile })
  }

  const handleContinue = () => {
    if (selectedProfile) {
      onComplete()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Choose Your Interview Profile</h2>
        <p className="text-muted-foreground text-lg">
          Select the role you'd like to be interviewed for. This will customize the questions to match your expertise.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Full Stack Node.js Profile */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedProfile === "fullstack-node" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:border-primary/50"
          }`}
          onClick={() => handleProfileSelect("fullstack-node")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Code className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Full Stack Node.js</CardTitle>
                <CardDescription>Backend + Frontend Development</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">Express</Badge>
                <Badge variant="secondary">MongoDB</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">API Design</Badge>
                <Badge variant="secondary">Database</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>Backend API development</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Frontend React applications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>Full-stack architecture</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* React Frontend Profile */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedProfile === "react" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:border-primary/50"
          }`}
          onClick={() => handleProfileSelect("react")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Palette className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-xl">React Frontend</CardTitle>
                <CardDescription>Frontend Development Focus</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Redux</Badge>
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">UI/UX</Badge>
                <Badge variant="secondary">Performance</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Component architecture</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span>UI/UX implementation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Frontend optimization</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleContinue}
          disabled={!selectedProfile}
          size="lg"
          className="px-8"
        >
          Continue with {selectedProfile === "fullstack-node" ? "Full Stack Node.js" : selectedProfile === "react" ? "React Frontend" : "Selected Profile"}
        </Button>
      </div>
    </div>
  )
}
