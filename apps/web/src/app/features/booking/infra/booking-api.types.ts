export type BookingSlotDto = { startsAt: string; endsAt: string };

export type BookingSlotsResponseDto = { timeZone: string; slots: BookingSlotDto[] };

export type BookingConfirmationDto = {
  id: string;
  startsAt: string;
  endsAt: string;
  format: 'video' | 'phone';
  videoUrl: string | null;
};

export type BookingCancelPreviewDto = {
  startsAt: string;
  endsAt: string;
  format: 'video' | 'phone';
  status: 'confirmed' | 'cancelled';
  cancellable: boolean;
};

export type AdminBookingDto = {
  id: string;
  startsAt: string;
  endsAt: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  format: 'video' | 'phone';
  videoUrl: string | null;
  status: 'confirmed' | 'cancelled';
  cancelledAt: string | null;
  cancelledBy: 'visitor' | 'owner' | null;
  cancelReason: string | null;
  reminderSentAt: string | null;
  createdAt: string;
};

export type AvailabilityRuleDto = { weekday: number; startMinute: number; endMinute: number };

export type AvailabilityClosureDto = {
  id: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
};

export type ApiErrorBodyDto = {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
};
