import { sendNotificationEmail } from "../emails/NotificationMail";
import {
  NotificationParams,
  NotificationType,
} from '../types/notification';

export async function dispatchAppointmentEmail({
  type,
  appointment,
}: {
  type: NotificationType;
  appointment: any;
}) {
  const { user, doctor, lab, scheduledAt, test, oldDate, followUpNotes } = appointment;

  const baseInfo = {
    email: user.email,
    recipientName: user.name,
  };

  switch (type) {
    case 'PENDING': {
      if (!doctor) throw new Error('Doctor is required for appointment creation');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        doctorName: doctor.user.name,
        appointmentDate: scheduledAt,
        location: doctor.clinicLocation ?? 'Clinic',
      };

      return await sendNotificationEmail(data);
    }

    case 'CONFIRMED': {
      if (!doctor) throw new Error('Doctor is required for confirmation');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        doctorName: doctor.user.name,
        appointmentDate: scheduledAt,
      };

      return await sendNotificationEmail(data);
    }

    case 'RESCHEDULED': {
      if (!doctor || !oldDate) throw new Error('Doctor and oldDate required for rescheduling');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        doctorName: doctor.user.name,
        appointmentDate: scheduledAt,
        oldDate,
      };

      return await sendNotificationEmail(data);
    }

    case 'CANCELLED': {
      if (!doctor) throw new Error('Doctor is required for cancellation');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        doctorName: doctor.user.name,
        appointmentDate: scheduledAt,
      };

      return await sendNotificationEmail(data);
    }

    case 'COMPLETED': {
      if (!doctor) throw new Error('Doctor is required for completion');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        doctorName: doctor.user.name,
        appointmentDate: scheduledAt,
        followUpNotes,
      };

      return await sendNotificationEmail(data);
    }

    case 'LAB_TEST': {
      if (!lab || !test) throw new Error('Lab and test are required for lab test email');

      const data: NotificationParams = {
        type,
        ...baseInfo,
        labName: lab.name,
        testName: test.name,
        appointmentDate: scheduledAt,
        preparationInstructions: test.preparationInstructions ?? '',
      };

      return await sendNotificationEmail(data);
    }

    case 'MEDICATION_REMINDER': {
      // This is not triggered via appointment normally, but here's a fallback if needed
      throw new Error('Use a separate flow for medication reminders.');
    }

    default:
      throw new Error(`Unhandled email notification type: ${type}`);
  }
}
