import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-sm text-[13px] font-medium tracking-[-0.01em] font-[family-name:var(--font-sans)] transition-opacity disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--text)] text-[var(--bg)] hover:opacity-90',
        accent:
          'bg-[var(--accent)] text-white hover:opacity-90',
        secondary:
          'bg-transparent text-[var(--text)] border border-[var(--border-s)] hover:bg-[var(--surface-2)]',
        ghost:
          'bg-transparent text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        destructive:
          'bg-[var(--red-bg)] text-[var(--red)] border border-[var(--red)] hover:opacity-80',
      },
      size: {
        sm: 'h-7 px-3 text-[12px]',
        md: 'h-8 px-4 py-2',
        lg: 'h-10 px-5 text-[14px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
