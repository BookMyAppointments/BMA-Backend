
export const verificationEmailTemplate = (code: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .code { 
            font-size: 24px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0;
            padding: 10px;
            background-color: #f4f4f4;
            border-radius: 5px;
        }
        .footer { margin-top: 20px; font-size: 12px; text-align: center; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Thank you for registering with our service. Please use the following verification code to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const passwordResetTemplate = (userName: string, resetCode: string) => {
    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #607D8B; color: white; padding: 10px; text-align: center; }
            .content { padding: 20px; }
            .code { 
                font-size: 24px; 
                font-weight: bold; 
                text-align: center; 
                margin: 20px 0;
                padding: 10px;
                background-color: #f4f4f4;
                border-radius: 5px;
            }
            .warning {
                color: #F44336;
                font-weight: bold;
            }
            .reset-btn {
                display: block;
                width: 200px;
                margin: 20px auto;
                padding: 10px;
                background-color: #607D8B;
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
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <p>Dear ${userName},</p>
                <p>We received a request to reset your password. Please use the following code to reset your password:</p>
                <div class="code">${resetCode}</div>
                <p>Alternatively, you can click the button below:</p>
                <a href="#" class="reset-btn">Reset Password</a>
                <p class="warning">This reset code will expire in 30 minutes for security reasons.</p>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
