import { appointmentCancellationTemplate, appointmentCompletedTemplate, appointmentConfirmationTemplate, appointmentCreatedTemplate, appointmentRescheduleTemplate, labTestAppointmentTemplate } from "../emails/templates/appointment.templates";
import { medicationReminderTemplate } from "../emails/templates/reminders.templates";
import { NotificationParams, LabTestParams, AppointmentCreatedParams, AppointmentConfirmedParams, AppointmentRescheduledParams, AppointmentCancelledParams, AppointmentCompletedParams, MedicationReminderParams } from "../types/notification";

export const getEmailSubject = (params: NotificationParams): string => {
    switch (params.type) {

        case 'PENDING':
            return 'Appointment Created Successfully';
        case 'CONFIRMED':
            return 'Your Appointment Has Been Confirmed';
        case 'RESCHEDULED':
            return 'Your Appointment Has Been Rescheduled';
        case 'CANCELLED':
            return 'Your Appointment Has Been Cancelled';
        case 'COMPLETED':
            return 'Your Appointment Is Complete';
        case 'LAB_TEST':
            return `Lab Test Appointment: ${(params as LabTestParams).testName}`;
        case 'MEDICATION_REMINDER':
            return 'Medication Reminder';
    }
};

export const getPlainTextContent = (params: NotificationParams): string => {
    switch (params.type) {
        case 'PENDING':
            const createdParams = params as AppointmentCreatedParams;
            return `Dear ${params.recipientName},\n\nYour appointment with Dr. ${createdParams.doctorName} has been created for ${createdParams.appointmentDate.toLocaleString()}.\nLocation: ${createdParams.location}\n\nThis appointment is pending confirmation from the doctor.`;

        case 'CONFIRMED':
            const confirmedParams = params as AppointmentConfirmedParams;
            return `Dear ${params.recipientName},\n\nYour appointment with Dr. ${confirmedParams.doctorName} has been confirmed for ${confirmedParams.appointmentDate.toLocaleString()}.\n\nPlease arrive 15 minutes before your scheduled time.`;

        case 'RESCHEDULED':
            const rescheduledParams = params as AppointmentRescheduledParams;
            return `Dear ${params.recipientName},\n\nYour appointment with Dr. ${rescheduledParams.doctorName} has been rescheduled.\nOld time: ${rescheduledParams.oldDate.toLocaleString()}\nNew time: ${rescheduledParams.appointmentDate.toLocaleString()}`;

        case 'CANCELLED':
            const cancelledParams = params as AppointmentCancelledParams;
            return `Dear ${params.recipientName},\n\nYour appointment with Dr. ${cancelledParams.doctorName} scheduled for ${cancelledParams.appointmentDate.toLocaleString()} has been cancelled.`;

        case 'COMPLETED':
            const completedParams = params as AppointmentCompletedParams;
            let completedText = `Dear ${params.recipientName},\n\nYour appointment with Dr. ${completedParams.doctorName} on ${completedParams.appointmentDate.toLocaleString()} has been marked as completed.`;
            if (completedParams.followUpNotes) {
                completedText += `\n\nFollow-up Notes: ${completedParams.followUpNotes}`;
            }
            return completedText;

        case 'LAB_TEST':
            const labParams = params as LabTestParams;
            let labText = `Dear ${params.recipientName},\n\nYour lab test appointment for ${labParams.testName} has been scheduled at ${labParams.labName} on ${labParams.appointmentDate.toLocaleString()}.`;
            if (labParams.preparationInstructions) {
                labText += `\n\nPreparation Instructions: ${labParams.preparationInstructions}`;
            }
            return labText;

        case 'MEDICATION_REMINDER':
            const medicationParams = params as MedicationReminderParams;
            return `Dear ${params.recipientName},\n\nThis is a reminder to take your medication: ${medicationParams.medicationName}, ${medicationParams.dosage}, ${medicationParams.schedule}.`;
    }
};

export const getHtmlContent = (params: NotificationParams): string => {
    switch (params.type) {

        case 'PENDING':
            const createdParams = params as AppointmentCreatedParams;
            return appointmentCreatedTemplate(
                createdParams.doctorName,
                createdParams.appointmentDate,
                createdParams.recipientName,
                createdParams.location
            );

        case 'CONFIRMED':
            const confirmedParams = params as AppointmentConfirmedParams;
            return appointmentConfirmationTemplate(
                confirmedParams.doctorName,
                confirmedParams.appointmentDate,
                confirmedParams.recipientName
            );

        case 'RESCHEDULED':
            const rescheduledParams = params as AppointmentRescheduledParams;
            return appointmentRescheduleTemplate(
                rescheduledParams.doctorName,
                rescheduledParams.oldDate,
                rescheduledParams.appointmentDate,
                rescheduledParams.recipientName
            );

        case 'CANCELLED':
            const cancelledParams = params as AppointmentCancelledParams;
            return appointmentCancellationTemplate(
                cancelledParams.doctorName,
                cancelledParams.appointmentDate,
                cancelledParams.recipientName
            );

        case 'COMPLETED':
            const completedParams = params as AppointmentCompletedParams;
            return appointmentCompletedTemplate(
                completedParams.doctorName,
                completedParams.appointmentDate,
                completedParams.recipientName,
                completedParams.followUpNotes
            );

        case 'LAB_TEST':
            const labParams = params as LabTestParams;
            return labTestAppointmentTemplate(
                labParams.labName,
                labParams.testName,
                labParams.appointmentDate,
                labParams.recipientName,
                labParams.preparationInstructions
            );

        case 'MEDICATION_REMINDER':
            const medicationParams = params as MedicationReminderParams;
            return medicationReminderTemplate(
                medicationParams.recipientName,
                medicationParams.medicationName,
                medicationParams.dosage,
                medicationParams.schedule
            );
    }
};
