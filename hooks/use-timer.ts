"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseTimerProps {
  initialTime: number
  onTimeUp?: () => void
  autoStart?: boolean
}

export function useTimer({ initialTime, onTimeUp, autoStart = false }: UseTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsRunning(true)
    setIsPaused(false)

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onTimeUp])

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setIsPaused(true)
  }, [])

  const resumeTimer = useCallback(() => {
    if (timeRemaining > 0) {
      startTimer()
    }
  }, [timeRemaining, startTimer])

  const resetTimer = useCallback(
    (newTime?: number) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setTimeRemaining(newTime ?? initialTime)
      setIsRunning(false)
      setIsPaused(false)
    },
    [initialTime],
  )

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setIsPaused(false)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  return {
    timeRemaining,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    formatTime: () => formatTime(timeRemaining),
  }
}
