
export const medicationReminderTemplate = (patientName: string, medicationName: string, dosage: string, schedule: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #E91E63; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .medication-details { 
            margin: 20px 0;
            padding: 15px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .medication-details p { margin: 5px 0; }
        .reminder {
            font-size: 18px;
            font-weight: bold;
            color: #E91E63;
            text-align: center;
            margin: 20px 0;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Medication Reminder</h1>
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>This is a friendly reminder to take your medication:</p>
            <div class="medication-details">
                <p><strong>Medication:</strong> ${medicationName}</p>
                <p><strong>Dosage:</strong> ${dosage}</p>
                <p><strong>Schedule:</strong> ${schedule}</p>
            </div>
            <p class="reminder">It's time to take your medication!</p>
            <p>Maintaining your medication schedule is important for your health. If you have any questions about your medication, please contact your healthcare provider.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;