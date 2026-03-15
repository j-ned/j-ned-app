export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
  readonly duration: number;
};
