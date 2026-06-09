import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  return (
    <div className={twMerge(clsx(
      'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-card',
      hover && 'hover:shadow-soft transition-shadow duration-200 cursor-pointer',
      paddings[padding],
      className
    ))}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  change?: { value: number; positive: boolean }
  color?: 'blue' | 'green' | 'amber' | 'sky' | 'rose'
  className?: string
}

const colorMap = {
  blue: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  green: 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-400',
  amber: 'bg-warning-50 text-warning-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  sky: 'bg-accent-50 text-accent-600 dark:bg-sky-900/20 dark:text-sky-400',
  rose: 'bg-error-50 text-error-600 dark:bg-red-900/20 dark:text-red-400',
}

export function StatCard({ label, value, icon, change, color = 'blue', className }: StatCardProps) {
  return (
    <Card className={clsx('flex items-start gap-4', className)}>
      <div className={clsx('p-3 rounded-xl', colorMap[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">{value}</p>
        {change && (
          <p className={clsx(
            'text-xs mt-1 font-medium',
            change.positive ? 'text-success-600 dark:text-green-400' : 'text-error-600 dark:text-red-400'
          )}>
            {change.positive ? '+' : ''}{change.value}% ce mois
          </p>
        )}
      </div>
    </Card>
  )
}
