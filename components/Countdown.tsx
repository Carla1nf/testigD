import React, { useState, useEffect } from "react"

const CountdownTimer = () => {
  // Set the target date to February 1st
  const targetDate = new Date("May 1, 2024 00:00:00").getTime()

  // State to store the remaining time
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Function to calculate the remaining time
  function calculateTimeRemaining() {
    const now = new Date().getTime()
    const difference = targetDate - now

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds }
    } else {
      // If the target date has passed, return all zeros
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
  }

  // Effect to update the remaining time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    // Cleanup the interval on component unmount
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m{" "}
    </>
  )
}

export default CountdownTimer
