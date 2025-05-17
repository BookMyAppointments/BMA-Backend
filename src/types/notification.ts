export type NotificationType =
    | 'PENDING'
    | 'CONFIRMED'
    | 'RESCHEDULED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'LAB_TEST'
    | 'MEDICATION_REMINDER'

export interface BaseNotificationParams {
    email: string;
    recipientName: string;
}

export interface MedicationReminderParams extends BaseNotificationParams {
    type: 'MEDICATION_REMINDER';
    medicationName: string;
    dosage: string;
    schedule: string;
}

export interface LabTestParams extends BaseNotificationParams {
    type: 'LAB_TEST';
    labName: string;
    testName: string;
    appointmentDate: Date;
    preparationInstructions?: string;
}

//* ------------ Base appointment params that most appointment types share ------------- *//
export interface BaseAppointmentParams extends BaseNotificationParams {
    doctorName: string;
    appointmentDate: Date;
}

export interface AppointmentCreatedParams extends BaseAppointmentParams {
    type: 'PENDING';
    location: string;
}

export interface AppointmentConfirmedParams extends BaseAppointmentParams {
    type: 'CONFIRMED';
}

export interface AppointmentRescheduledParams extends BaseAppointmentParams {
    type: 'RESCHEDULED';
    oldDate: Date;
}

export interface AppointmentCancelledParams extends BaseAppointmentParams {
    type: 'CANCELLED';
}

export interface AppointmentCompletedParams extends BaseAppointmentParams {
    type: 'COMPLETED';
    followUpNotes?: string;
}


//* ------------------- Union type for all possible notification params ------------------- *//
export type NotificationParams =
    | AppointmentCreatedParams
    | AppointmentConfirmedParams
    | AppointmentRescheduledParams
    | AppointmentCancelledParams
    | AppointmentCompletedParams
    | LabTestParams
    | MedicationReminderParams;
