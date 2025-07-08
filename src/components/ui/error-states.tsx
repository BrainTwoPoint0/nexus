import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  className,
}: ErrorMessageProps) {
  const typeStyles = {
    error: 'text-destructive border-destructive/20 bg-destructive/5',
    warning:
      'text-yellow-600 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900/20',
    info: 'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-lg border p-4', typeStyles[type], className)}
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="space-y-1">
          {title && <h4 className="font-medium">{title}</h4>}
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface PageErrorProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
}

export function PageError({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page. Please try again.',
  showRetry = true,
  showHome = true,
  onRetry,
  onHome,
}: PageErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="max-w-md text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-center space-x-3">
          {showRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button onClick={onHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface NotFoundErrorProps {
  title?: string;
  message?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onHome?: () => void;
}

export function NotFoundError({
  title = '404 - Page Not Found',
  message = 'The page you are looking for does not exist or has been moved.',
  showBack = true,
  showHome = true,
  onBack,
  onHome,
}: NotFoundErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="text-6xl font-bold text-muted-foreground/30">404</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="max-w-md text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-center space-x-3">
          {showBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
          {showHome && (
            <Button onClick={onHome} variant="default">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface FormErrorProps {
  errors: string[];
  className?: string;
}

export function FormError({ errors, className }: FormErrorProps) {
  if (errors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('space-y-2', className)}
    >
      {errors.map((error, index) => (
        <ErrorMessage key={index} message={error} type="error" />
      ))}
    </motion.div>
  );
}

interface CardErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function CardError({
  title = 'Failed to load',
  message,
  onRetry,
  showRetry = true,
}: CardErrorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{message}</p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
