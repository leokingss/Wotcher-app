import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onReload: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner = ({ message, onReload, onDismiss }: ErrorBannerProps) => {
  return (
    <div className="mx-3 mt-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
      <div className="neo-button-icon w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap reload to try again.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onReload}
          className="neo-button-icon p-2"
          aria-label="Reload"
          title="Reload"
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="neo-button-icon p-2"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
