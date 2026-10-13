export type BookingFormat = 'video' | 'phone';

export type BookingSlot = { readonly startsAt: string; readonly endsAt: string };

export type BookingSlotOption = BookingSlot & { readonly timeLabel: string };

export type BookingDay = {
  readonly date: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly slots: readonly BookingSlotOption[];
};

export type BookingWeek = {
  readonly key: string;
  readonly label: string;
  readonly days: readonly BookingDay[];
};

export type BookingRequest = {
  readonly startsAt: string;
  readonly name: string;
  readonly email: string;
  readonly format: BookingFormat;
  readonly phone: string | null;
  readonly company: string | null;
  readonly message: string;
  readonly website: string;
};

export type BookingDraft = {
  readonly startsAt: string;
  readonly name: string;
  readonly email: string;
  readonly format: BookingFormat;
  readonly phone: string;
  readonly company: string;
  readonly message: string;
  readonly website: string;
};

export type BookingConfirmation = {
  readonly id: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly format: BookingFormat;
  readonly videoUrl: string | null;
};

export type BookingFailureReason =
  | 'slot-taken'
  | 'slot-unavailable'
  | 'limit-reached'
  | 'rate-limited'
  | 'invalid'
  | 'network'
  | 'server';

export type BookingResult<TData, TReason> =
  | { readonly success: true; readonly data: TData }
  | { readonly success: false; readonly reason: TReason };

export type BookingSubmission = BookingResult<BookingConfirmation, BookingFailureReason>;

export type BookingCancelPreview = {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly format: BookingFormat;
  readonly status: 'confirmed' | 'cancelled';
  readonly cancellable: boolean;
};

export type BookingCancelFailure = 'not-found' | 'too-late' | 'network' | 'server';

export type BookingCancelPreviewResult = BookingResult<BookingCancelPreview, BookingCancelFailure>;

export type BookingCancelResult = BookingResult<null, BookingCancelFailure>;
