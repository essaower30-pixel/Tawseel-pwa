import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = "/";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-right select-none" 
          dir="rtl"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">
                {this.props.fallbackTitle || "حدث تنبيه بسيط في العرض 🛠️"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                تم حماية التطبيق من الإغلاق المفاجئ. يمكنك العودة للواجهة الرئيسية ومتابعة التصفح والطلب بشكل طبيعي.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية والتطبيق 🏠</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
