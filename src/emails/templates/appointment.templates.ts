
export const appointmentCreatedTemplate = (doctorName: string, appointmentDate: Date, patientName: string, location: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8BC34A; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .appointment-details p { margin: 5px 0; }
        .calendar-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px;
            background-color: #8BC34A;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
        }
        .note {
            margin: 20px 0;
            padding: 15px;
            background-color: #f1f8e9;
            border-left: 4px solid #8BC34A;
            border-radius: 3px;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Created</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>We've successfully created your appointment with the following details:</p>
            <div class="appointment-details">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
                <p><strong>Location:</strong> ${location}</p>
            </div>
            <p>Your appointment is currently <strong>pending confirmation</strong> from Dr. ${doctorName}. You will receive another email once your appointment is confirmed.</p>
            <div class="note">
                <p>Please note: This appointment requires confirmation from the healthcare provider. You may need to reschedule if the doctor is unavailable at the requested time.</p>
            </div>
            <p>Add this appointment to your calendar:</p>
            <a href="#" class="calendar-btn">Add to Calendar</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const appointmentConfirmationTemplate = (doctorName: string, appointmentDate: Date, patientName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .appointment-details p { margin: 5px 0; }
        .important { font-weight: bold; color: #2196F3; }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Confirmed</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your appointment has been confirmed with the following details:</p>
            <div class="appointment-details">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            <p class="important">Please arrive 15 minutes before your scheduled appointment time.</p>
            <p>If you need to reschedule or cancel your appointment, please do so at least 24 hours in advance.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const appointmentRescheduleTemplate = (doctorName: string, oldDate: Date, newDate: Date, patientName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .appointment-details p { margin: 5px 0; }
        .old-date { text-decoration: line-through; color: #777; }
        .new-date { font-weight: bold; color: #FF9800; }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Rescheduled</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your appointment with Dr. ${doctorName} has been rescheduled:</p>
            <div class="appointment-details">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Previous Date & Time:</strong> <span class="old-date">${oldDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</span></p>
                <p><strong>New Date & Time:</strong> <span class="new-date">${newDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</span></p>
            </div>
            <p>Please make note of this change in your calendar. If this new time doesn't work for you, please contact us as soon as possible.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const appointmentCancellationTemplate = (doctorName: string, appointmentDate: Date, patientName: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F44336; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
            text-decoration: line-through;
            color: #777;
        }
        .appointment-details p { margin: 5px 0; }
        .reschedule-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>This email confirms that your appointment has been cancelled:</p>
            <div class="appointment-details">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            <p>If you would like to schedule a new appointment, please click the button below or contact our office.</p>
            <a href="#" class="reschedule-btn">Schedule New Appointment</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const appointmentCompletedTemplate = (doctorName: string, appointmentDate: Date, patientName: string, followUpNotes?: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #673AB7; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .appointment-details p { margin: 5px 0; }
        .follow-up-notes {
            margin: 20px 0;
            padding: 15px;
            background-color: #e8eaf6;
            border-left: 4px solid #673AB7;
            border-radius: 3px;
        }
        .feedback-btn {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px;
            background-color: #FF9800;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Appointment Completed</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your recent appointment has been marked as completed:</p>
            <div class="appointment-details">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            ${followUpNotes ? `
            <p><strong>Follow-up Notes:</strong></p>
            <div class="follow-up-notes">
                <p>${followUpNotes}</p>
            </div>
            ` : ''}
            <p>Thank you for visiting our healthcare facility. Your health records have been updated.</p>
            <p>We value your feedback on your experience with us:</p>
            <a href="#" class="feedback-btn">Provide Feedback</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const labTestAppointmentTemplate = (labName: string, testName: string, appointmentDate: Date, patientName: string, preparationInstructions?: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #009688; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .appointment-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .appointment-details p { margin: 5px 0; }
        .instructions {
            margin: 20px 0;
            padding: 15px;
            background-color: #e0f2f1;
            border-left: 4px solid #009688;
            border-radius: 3px;
        }
        .warning {
            font-weight: bold;
            color: #F44336;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Lab Test Appointment</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your lab test appointment has been scheduled with the following details:</p>
            <div class="appointment-details">
                <p><strong>Lab:</strong> ${labName}</p>
                <p><strong>Test:</strong> ${testName}</p>
                <p><strong>Date & Time:</strong> ${appointmentDate.toLocaleString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            ${preparationInstructions ? `
            <p><strong>Preparation Instructions:</strong></p>
            <div class="instructions">
                <p>${preparationInstructions}</p>
            </div>
            ` : ''}
            <p class="warning">Please bring your ID and insurance card to your appointment.</p>
            <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
