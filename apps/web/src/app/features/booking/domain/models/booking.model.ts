export type Booking = {
  readonly id: number;
  readonly date: string;
  readonly startTime: string;
  readonly duration: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
  readonly createdAt: string;
};

export type BookingFormData = {
  readonly date: string;
  readonly startTime: string;
  readonly duration: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
};

export type BookingSubmission = {
  readonly success: boolean;
  readonly message: string;
};

export type DisabledDate = {
  readonly id: number;
  readonly date: string;
  readonly reason?: string;
};
