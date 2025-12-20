"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-solid-text-secondary dark:text-solid-text-light">
        Page <span className="text-[#4C7380] dark:text-[#4C7380]">{currentPage + 1}</span> of{" "}
        <span className="text-[#4C7380] dark:text-[#4C7380]">{Math.max(1, totalPages)}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={cn(
            "border-solid-border text-[#4C7380] hover:bg-solid-muted hover:text-[#4C7380] dark:border-solid-text-light/20 dark:text-[#4C7380] dark:hover:bg-solid-text-light/10",
            "transition-all duration-200 rounded-lg",
          )}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || totalPages === 0}
          className={cn(
            "border-solid-border text-[#4C7380] hover:bg-solid-muted hover:text-[#4C7380] dark:border-solid-text-light/20 dark:text-[#4C7380] dark:hover:bg-solid-text-light/10",
            "transition-all duration-200 rounded-lg",
          )}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
