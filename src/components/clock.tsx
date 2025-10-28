"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

export default function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="font-medium text-foreground/80 tabular-nums">
      <span>{format(time, "EEE, d MMM yyyy HH:mm:ss")}</span>
    </div>
  )
}
