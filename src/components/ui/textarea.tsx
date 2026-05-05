import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-[12px] font-medium text-[var(--text-2)]">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full bg-[var(--surface)] border border-[var(--border-s)] rounded-sm px-3 py-2 text-[13px] text-[var(--text)] font-[family-name:var(--font-sans)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none',
            error && 'border-[var(--red)] focus:border-[var(--red)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-[var(--red)]">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
