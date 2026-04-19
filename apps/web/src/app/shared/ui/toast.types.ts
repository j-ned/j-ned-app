export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export type ToastMessage = {
  severity?: ToastSeverity;
  summary?: string;
  detail?: string;
  life?: number;
};

export type ToastEntry = {
  id: number;
  severity: ToastSeverity;
  summary?: string;
  detail?: string;
  life: number;
};
