import { ContactParams } from "../../types/contact";

// Add this to your existing getEmailSubject function
export const getContactEmailSubject = (params: ContactParams): string => {
    return `Contact Form: ${params.subject}`;
};

// Add this to your existing getHtmlContent function
export const getContactHtmlContent = (params: ContactParams): string => {
    return `
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
                background: #dc2626;
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
              .field {
                margin-bottom: 15px;
              }
              .label {
                font-weight: bold;
                color: #374151;
              }
              .value {
                margin-top: 5px;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border: 1px solid #d1d5db;
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
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${params.name}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${params.email}</div>
                </div>
                <div class="field">
                  <div class="label">Subject:</div>
                  <div class="value">${params.subject}</div>
                </div>
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value">${params.message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
              <div class="footer">
                <p>This message was sent through the website contact form.</p>
                <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
    `;
};

// Add this to your existing getPlainTextContent function
export const getContactPlainTextContent = (params: ContactParams): string => {
    return `
        New Contact Form Submission
        
        Name: ${params.name}
        Email: ${params.email}
        Subject: ${params.subject}
        
        Message:
        ${params.message}
        
        This message was sent through the website contact form.
    `;
};