import React from 'react';
import { ShieldAlert, RotateCcw, Home, Copy, CheckCircle2 } from 'lucide-react';
import { Language } from '../i18n/translations';
import {
  buildErrorIncidentReport,
  shouldAutoResetBoundary,
  ErrorIncidentReport,
} from '../services/errorBoundaryService';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  portalKey: string;
  language: Language;
  onResetToDefaultPortal?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  incident: ErrorIncidentReport | null;
  prevPortalKey: string;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      incident: null,
      prevPortalKey: props.portalKey,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  static getDerivedStateFromProps(
    nextProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    if (
      prevState.hasError &&
      shouldAutoResetBoundary([prevState.prevPortalKey], [nextProps.portalKey])
    ) {
      return {
        hasError: false,
        error: null,
        incident: null,
        prevPortalKey: nextProps.portalKey,
        copied: false,
      };
    }
    if (prevState.prevPortalKey !== nextProps.portalKey) {
      return { prevPortalKey: nextProps.portalKey };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const incident = buildErrorIncidentReport(
      error,
      this.props.portalKey,
      errorInfo.componentStack || undefined
    );
    this.setState({ incident });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      incident: null,
      copied: false,
    });
  };

  handleCopyDiagnostic = (): void => {
    const { incident, error } = this.state;
    const payload = JSON.stringify(
      incident || { message: error?.message, portal: this.props.portalKey },
      null,
      2
    );
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    this.setState({ copied: true });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isFa = this.props.language === 'fa';
    const incident =
      this.state.incident ||
      buildErrorIncidentReport(this.state.error, this.props.portalKey);

    return (
      <div
        data-testid="error-boundary-fallback"
        className="max-w-2xl mx-auto my-8 bg-slate-900/95 border border-rose-500/40 rounded-2xl p-6 shadow-2xl text-slate-100"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-white">
                {isFa
                  ? 'محافظ ایزوله‌سازی خطا فعال شد (Portal Error Boundary)'
                  : 'Portal Runtime Error Boundary Activated'}
              </h2>
              <span
                dir="ltr"
                className="text-xs font-mono px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/30 text-rose-300"
              >
                {incident.incidentId}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {isFa
                ? 'یک خطای غیرمنتظره در این بخش مهار شد تا از توقف کل سامانه جلوگیری شود. سایر پرتال‌ها و داده‌های تراکنشی کاملاً ایمن هستند.'
                : 'An unexpected runtime exception was isolated inside this portal to prevent an application-wide crash. Other portals and storage remain intact.'}
            </p>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 mb-4">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                {isFa ? 'پیام خطای فنی:' : 'Technical Exception Message:'}
              </div>
              <div dir="ltr" className="text-xs font-mono text-rose-300 break-all">
                {incident.errorName}: {incident.errorMessage}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-testid="error-boundary-retry-btn"
                onClick={this.handleRetry}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? 'تلاش مجدد و بازنشانی نما' : 'Retry & Reset View'}</span>
              </button>

              {this.props.onResetToDefaultPortal && (
                <button
                  type="button"
                  onClick={() => {
                    this.handleRetry();
                    this.props.onResetToDefaultPortal?.();
                  }}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isFa ? 'بازگشت به پرتال اصلی' : 'Return to Default Portal'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={this.handleCopyDiagnostic}
                className="h-9 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {this.state.copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {this.state.copied
                    ? isFa
                      ? 'گزارش کپی شد'
                      : 'Copied'
                    : isFa
                    ? 'کپی شناسه خطا'
                    : 'Copy Diagnostic JSON'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
