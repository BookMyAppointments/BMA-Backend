import { transporter } from '../utils/nodemailer';

interface HospitalMailProps {
  email: string;
  linkId: string;
  frontendUrl: string;
}

export const sendHospitalCreationMail = async ({
  email,
  linkId,
  frontendUrl
}: HospitalMailProps) => {
  const subject = 'Hospital Registration Approved';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hospital Registration Approved</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your request to register a hospital has been approved! You can now proceed with creating your hospital profile.</p>
            <p>Please click the button below to complete the registration process:</p>
            <p style="text-align: center;">
              <a href="${frontendUrl}/admin/hospital/create/${linkId}" class="button">
                Create Hospital Profile
              </a>
            </p>
            <p><strong>Note:</strong> This link will expire in 24 hours for security purposes.</p>
            <p>If the button doesn't work, you can copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">
              ${frontendUrl}/admin/hospital/create/${linkId}
            </p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} BookMyAppointment. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      to: email,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending hospital creation email:', error);
    return { success: false, error };
  }
};