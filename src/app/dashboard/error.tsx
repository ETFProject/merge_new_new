'use client' // Error boundaries must be Client Components
 
import { useEffect } from 'react'
import Link from 'next/link'
 
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])
 
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard Error</h2>
      <p className="text-muted-foreground mb-2 text-center max-w-md">
        There was an error loading the dashboard content. This could be due to network issues or data unavailability.
      </p>
      <div className="flex gap-4 mt-6">
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link 
          href="/"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
} 