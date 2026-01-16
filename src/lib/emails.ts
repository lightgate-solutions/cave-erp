import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const passwordSendEmail = process.env.RESEND_PASSWORD_RESET_EMAIL;

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string }[];
}) {
  const { data, error } = await resend.emails.send({
    from: `Cave ERP <${passwordSendEmail}>`,
    to: to,
    subject: subject,
    replyTo: replyTo ? replyTo : "contact@lightgatesolutions.com",
    html: html,
    text: text,
    attachments: attachments,
  });

  if (error) {
    console.error("Resend API Error");
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name: string };
  url: string;
}) {
  return sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Cave ERP Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nYou requested to reset your password. Click this link to reset it: ${url}\n\nIf you didn't request this, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nCave ERP`,
  });
}

export function sendInAppEmailNotification({
  recipient,
  sender,
  emailData,
  appUrl,
}: {
  recipient: { email: string; name: string };
  sender: { name: string; email: string };
  emailData: {
    id: number;
    subject: string;
    body: string;
    attachmentCount: number;
    emailType: "sent" | "reply" | "forward";
  };
  appUrl: string;
}) {
  // Truncate body for preview (max 200 characters)
  const bodyPreview =
    emailData.body.length > 200
      ? `${emailData.body.substring(0, 200)}...`
      : emailData.body;

  // Create deep link to email
  const emailLink = `${appUrl}/mail/inbox?id=${emailData.id}`;

  // Determine email type label
  const typeLabel =
    emailData.emailType === "reply"
      ? "replied to your message"
      : emailData.emailType === "forward"
        ? "forwarded you a message"
        : "sent you a message";

  return sendEmail({
    to: recipient.email,
    replyTo: sender.email,
    subject: `${sender.name} ${typeLabel}: ${emailData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #1f2937; margin: 0;">New Message from ${sender.name}</h2>
        </div>

        <div style="background-color: white; padding: 24px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">From:</p>
            <p style="margin: 0; color: #1f2937; font-weight: 600;">${sender.name}</p>
          </div>

          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Subject:</p>
            <p style="margin: 0; color: #1f2937; font-weight: 600;">${emailData.subject}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Message Preview:</p>
            <div style="background-color: #f9fafb; padding: 12px; border-radius: 4px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; color: #374151; white-space: pre-wrap;">${bodyPreview}</p>
            </div>
          </div>

          ${
            emailData.attachmentCount > 0
              ? `
          <div style="margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              📎 ${emailData.attachmentCount} attachment${emailData.attachmentCount !== 1 ? "s" : ""}
            </p>
          </div>
          `
              : ""
          }

          <a href="${emailLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Full Message
          </a>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from Cave ERP. You received this because you have email notifications enabled.
          </p>
        </div>
      </div>
    `,
    text: `
${sender.name} ${typeLabel}

Subject: ${emailData.subject}

Message Preview:
${bodyPreview}

${emailData.attachmentCount > 0 ? `Attachments: ${emailData.attachmentCount}\n` : ""}
View full message: ${emailLink}

---
This is an automated notification from Cave ERP.
To manage your notification preferences, log in to your account.
    `.trim(),
  });
}

export function sendTaskNotificationEmail({
  recipient,
  taskData,
  appUrl,
}: {
  recipient: { email: string; name: string };
  taskData: {
    id: number;
    title: string;
    description: string;
    dueDate?: string;
    type: "assignment" | "deadline" | "approval";
  };
  appUrl: string;
}) {
  const taskLink = `${appUrl}/tasks/${taskData.id}`;
  const typeLabel =
    taskData.type === "assignment"
      ? "New Task Assigned"
      : taskData.type === "deadline"
        ? "Task Deadline Reminder"
        : "Task Approval Required";

  return sendEmail({
    to: recipient.email,
    subject: `${typeLabel}: ${taskData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #1f2937; margin: 0;">${typeLabel}</h2>
        </div>

        <div style="background-color: white; padding: 24px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Task:</p>
            <p style="margin: 0; color: #1f2937; font-weight: 600;">${taskData.title}</p>
          </div>

          ${
            taskData.description
              ? `
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Description:</p>
            <p style="margin: 0; color: #374151;">${taskData.description}</p>
          </div>
          `
              : ""
          }

          ${
            taskData.dueDate
              ? `
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Due Date:</p>
            <p style="margin: 0; color: #dc2626; font-weight: 600;">${taskData.dueDate}</p>
          </div>
          `
              : ""
          }

          <a href="${taskLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Task Details
          </a>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from Cave ERP.
          </p>
        </div>
      </div>
    `,
    text: `
${typeLabel}

Task: ${taskData.title}
${taskData.description ? `\nDescription: ${taskData.description}` : ""}
${taskData.dueDate ? `\nDue Date: ${taskData.dueDate}` : ""}

View task details: ${taskLink}

---
This is an automated notification from Cave ERP.
    `.trim(),
  });
}

export function sendGeneralNotificationEmail({
  recipient,
  notificationData,
  appUrl,
}: {
  recipient: { email: string; name: string };
  notificationData: {
    id: number;
    title: string;
    message: string;
    type: "approval" | "deadline" | "general";
  };
  appUrl: string;
}) {
  const notificationLink = `${appUrl}/notifications`;

  return sendEmail({
    to: recipient.email,
    subject: notificationData.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #1f2937; margin: 0;">${notificationData.title}</h2>
        </div>

        <div style="background-color: white; padding: 24px; border: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #374151; white-space: pre-wrap;">${notificationData.message}</p>

          <a href="${notificationLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 24px;">
            View in Dashboard
          </a>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from Cave ERP.
          </p>
        </div>
      </div>
    `,
    text: `
${notificationData.title}

${notificationData.message}

View in dashboard: ${notificationLink}

---
This is an automated notification from Cave ERP.
    `.trim(),
  });
}

export async function sendOrganizationInviteEmail({
  invitation,
  inviter,
  organization,
  email,
}: {
  invitation: { id: string };
  inviter: { name: string };
  organization: { name: string };
  email: string;
}) {
  await sendEmail({
    to: email,
    subject: `You're invited to join the ${organization.name} organization`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're invited to join ${organization.name}</h2>
        <p>Hello ${inviter.name},</p>
        <p>${inviter.name} invited you to join the ${organization.name} organization. Please click the button below to accept/reject the invitation:</p>
        <a href="${process.env.BETTER_AUTH_URL}/organizations/invites/${invitation.id}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Manage Invitation</a>
        <p>Best regards,<br>The Cave Team</p>
      </div>
    `,
    text: `You're invited to join the ${organization.name} organization\n\nHello ${inviter.name},\n\n${inviter.name} invited you to join the ${organization.name} organization. Please click the link below to accept/reject the invitation:\n\n${process.env.BETTER_AUTH_URL}/organizations/invites/${invitation.id}\n\nBest regards,\nThe Cave Team`,
  });
}

interface EmailVerificationData {
  user: {
    name: string;
    email: string;
  };
  url: string;
}

export async function sendEmailVerificationEmail({
  user,
  url,
}: EmailVerificationData) {
  await sendEmail({
    to: user.email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Cave Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nThank you for signing up! Please verify your email address by clicking this link: ${url}\n\nIf you didn't create an account, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  });
}

interface EmailVerificationData {
  user: {
    name: string;
    email: string;
  };
  url: string;
}

export async function sendDeleteAccountVerificationEmail({
  user,
  url,
}: EmailVerificationData) {
  await sendEmail({
    to: user.email,
    subject: "Delete your account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirm Account Deletion</h2>
        <p>Hello ${user.name},</p>
        <p>We're sorry to see you go! Please confirm your account deletion by clicking the button below:</p>
        <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Confirm Deletion</a>
        <p>If you don't have an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Cave Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nWe're sorry to see you go! Please confirm your account deletion by clicking this link: ${url}\n\nIf you don't have an account, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe Cave Team`,
  });
}

export function sendOtpEmail({
  user,
  otp,
}: {
  user: { email: string; name: string };
  otp: string;
}) {
  return sendEmail({
    to: user.email,
    subject: "Cave - One-Time Password (OTP)",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Hello ${user.name},</p>
        <p>Use the code below to verify your identity or complete your sign-in:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 24px 0; text-align: center; color: #007bff;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes for your security.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The Cave Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nYour OTP code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Cave Team`,
  });
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  await sendEmail({
    to: user.email,
    subject: "Welcome to The Cave Business Management Software!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Cave!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for signing up for our app! We're excited to have you on board.</p>
        <p>Best regards,
        <br>
        The Cave Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nThank you for signing up for our app! We're excited to have you on board.\n\nBest regards,\nThe Cave Team`,
  });
}

export async function sendInvoiceEmail({
  to,
  invoiceDetails,
  pdfBuffer,
  organizationName,
}: {
  to: string;
  invoiceDetails: {
    invoiceId: string;
    amount: number;
    dueDate: string;
    items: Array<{ description: string; amount: string }>;
    paymentLink?: string;
    currencySymbol?: string;
  };
  pdfBuffer?: Buffer;
  organizationName?: string;
}) {
  const currencySymbol = invoiceDetails.currencySymbol || "₦";
  const _currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD", // Fallback, we'll manually prepend symbol
  });

  // Custom format since Intl requires valid currency code
  const format = (val: number | string) =>
    `${currencySymbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemsHtml = invoiceDetails.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0; color: #333;">${item.description}</td>
      <td style="padding: 12px 0; text-align: right; color: #333; font-weight: 500;">${format(item.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const itemsText = invoiceDetails.items
    .map((item) => `${item.description}: ${format(item.amount)}`)
    .join("\n");

  const payButtonUrl =
    invoiceDetails.paymentLink ||
    `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;

  const orgName = organizationName || "The Cave Team";

  await sendEmail({
    to,
    subject: `New Invoice Available - ${invoiceDetails.invoiceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #333; margin: 0;">New Invoice Available</h2>
          <p style="color: #666; margin-top: 8px;">Invoice #${
            invoiceDetails.invoiceId
          }</p>
        </div>
        
        <div style="padding: 24px; border: 1px solid #eee; border-top: none; background-color: white;">
          <p>Hello,</p>
          <p>A new invoice has been generated for your account. Please find the attached PDF invoice.</p>
          
          <div style="margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Due Date:</span>
              <span style="font-weight: 500;">${invoiceDetails.dueDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Total Amount:</span>
              <span style="font-weight: bold; color: #007bff; font-size: 18px;">${format(invoiceDetails.amount)}</span>
            </div>
          </div>

          <h3 style="color: #333; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 32px;">Invoice Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="${payButtonUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
          </div>
          <div style="margin-top: 16px; text-align: center;">
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing" style="color: #007bff; text-decoration: none; font-size: 14px;">View Invoice Details</a>
          </div>
        </div>
        
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
          <p>Thank you for your business!</p>
          <p>${orgName}</p>
        </div>
      </div>
    `,
    text: `Hello,\n\nA new invoice has been generated for your account.\n\nInvoice #${
      invoiceDetails.invoiceId
    }\nDue Date: ${invoiceDetails.dueDate}\nTotal Amount: ${format(invoiceDetails.amount)}\n\nItems:\n${itemsText}\n\nPay Now: ${payButtonUrl}\nView Invoice Details: ${
      process.env.NEXT_PUBLIC_APP_URL
    }/settings/billing\n\nThank you for your business!\n${orgName}`,
    attachments: pdfBuffer
      ? [
          {
            filename: `Invoice_${invoiceDetails.invoiceId}.pdf`,
            content: pdfBuffer,
          },
        ]
      : undefined,
  });
}

export async function sendOverdueInvoiceEmail({
  to,
  userName,
  invoiceId,
  amount,
  dueDate,
  daysOverdue,
}: {
  to: string;
  userName: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}) {
  const currencyFormatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const formattedAmount = currencyFormatter.format(amount);
  const payButtonUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`;

  await sendEmail({
    to,
    subject: `Overdue Invoice Reminder - ${invoiceId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3cd; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid #ffeeba;">
          <h2 style="color: #856404; margin: 0;">Payment Overdue</h2>
          <p style="color: #856404; margin-top: 8px;">Invoice #${invoiceId}</p>
        </div>
        
        <div style="padding: 24px; border: 1px solid #eee; border-top: none; background-color: white;">
          <p>Hello ${userName},</p>
          <p>This is a friendly reminder that we haven't received payment for invoice <strong>#${invoiceId}</strong>, which was due on <strong>${dueDate}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Amount Due:</span>
              <span style="font-weight: bold; color: #dc3545;">${formattedAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Days Overdue:</span>
              <span style="font-weight: 500;">${daysOverdue} days</span>
            </div>
          </div>

          <p>Please make the payment as soon as possible to avoid any service interruption.</p>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="${payButtonUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
          </div>
          
          <div style="margin-top: 16px; text-align: center;">
             <a href="${payButtonUrl}" style="color: #007bff; text-decoration: none; font-size: 14px;">View Invoice Details</a>
          </div>
        </div>
        
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
          <p>If you have already made this payment, please disregard this email.</p>
          <p>The Cave Team</p>
        </div>
      </div>
    `,
    text: `Hello ${userName},\n\nThis is a friendly reminder that we haven't received payment for invoice #${invoiceId}, which was due on ${dueDate}.\n\nAmount Due: ${formattedAmount}\nDays Overdue: ${daysOverdue}\n\nPlease make the payment as soon as possible to avoid any service interruption.\n\nPay Now: ${payButtonUrl}\n\nIf you have already made this payment, please disregard this email.\n\nThe Cave Team`,
  });
}
