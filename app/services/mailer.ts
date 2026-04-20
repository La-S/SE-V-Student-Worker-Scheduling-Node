import nodemailer, { type SendMailOptions } from "nodemailer";
import "dotenv/config";

import BusinessUnit from "../models/businessunit.model.ts";
import Announcement from "../models/announcement.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import File from "../models/file.model.ts";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";
import { logger } from "../logger/logger.ts";

type EmailContent = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SendMailOptions["attachments"];
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function getFromAddress(): string | null {
  const from = process.env.EMAIL_USER?.trim();
  if (!from) {
    console.warn("EMAIL_USER is not configured. Email will be skipped.");
    logger.log('error', "EMAIL_USER is not configured. Email will be skipped.");
    return null;
  }
  return from;
}



export async function sendEmail(content: EmailContent): Promise<boolean> {
  const from = getFromAddress();
  if (!from) {
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to: content.to,
      subject: content.subject,
      text: content.text,
      html: content.html ?? `<p>${escapeHtml(content.text)}</p>`,
      attachments: content.attachments,
    });
    return true;
  } catch (error) {
    logger.log("error", "There was an error with nodemailer: "+ JSON.stringify(error));
    logger.log("error", error);

    return false;
  }
}

export async function getEmailAddressesForEmployeeIds(employeeIds: number[]): Promise<string[]> {
  const uniqueEmployeeIds = [...new Set(employeeIds)];
  if (uniqueEmployeeIds.length === 0) {
    return [];
  }

  const employees = await Employee.findAll({
    where: {
      id: uniqueEmployeeIds,
    },
    include: [User],
  });

  return employees
    .map((employee) => (employee as any)?.dataValues?.user?.dataValues?.email?.trim())
    .filter((email): email is string => Boolean(email));
}

export async function getEmailAddressesForBusinessUnitEmployees(businessUnitId: number): Promise<string[]> {
  const employees = await Employee.findAll({
    where: {
      businessUnitId,
      currentlyEmployed: true,
    },
    include: [User],
  });

  return employees
    .map((employee) => (employee as any)?.dataValues?.user?.dataValues?.email?.trim())
    .filter((email): email is string => Boolean(email));
}

export async function getEmailAddressesForBusinessUnitManagers(businessUnitId: number): Promise<string[]> {
  const employees = await Employee.findAll({
    where: {
      businessUnitId,
      currentlyEmployed: true,
      isManager: true,
    },
    include: [User],
  });

  return employees
    .map((employee) => (employee as any)?.dataValues?.user?.dataValues?.email?.trim())
    .filter((email): email is string => Boolean(email));
}

export async function sendEmailToEmployeeId(
  employeeId: number,
  subject: string,
  text: string,
  html?: string,
): Promise<boolean> {
  const employee = await Employee.findByPk(employeeId, {
    include: [User],
  });
  const email = (employee as any)?.dataValues?.user?.dataValues?.email?.trim();

  if (!email) {
    console.warn(`Employee Id ${employeeId} does not have an email address.`);
    return false;
  }

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendEmailToEmployeeIds(
  employeeIds: number[],
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const emails = await getEmailAddressesForEmployeeIds(employeeIds);
  await sendEmailToAddresses(emails, subject, text, html);
}

export async function sendEmailToBusinessUnit(
  businessUnitId: number,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const emails = await getEmailAddressesForBusinessUnitEmployees(businessUnitId);
  await sendEmailToAddresses(emails, subject, text, html);
}

export async function sendEmailToManagers(
  businessUnitId: number,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const emails = await getEmailAddressesForBusinessUnitManagers(businessUnitId);
  await sendEmailToAddresses(emails, subject, text, html);
}

export async function sendEmployeeAssignmentEmail(
  employeeId: number,
  businessUnitId: number,
): Promise<boolean> {
  const businessUnit = await BusinessUnit.findByPk(businessUnitId);
  const businessName = (businessUnit as any)?.dataValues?.name?.trim() || "your business";
  const subject = `Congratulations on being hired by ${businessName}`;
  const text = `Congratulations on being hired by ${businessName}. You have been added to the scheduling system.`;

  return sendEmailToEmployeeId(
    employeeId,
    subject,
    text,
    buildEmployeeEmailHtml({
      heading: `Congratulations on being hired by ${businessName}`,
      body: "You have been added to the scheduling system. Use the button below to sign in and get started.",
      buttonLabel: "Click here to register",
      buttonHref: "https://workerscheduling.eaglesoftwareteam.com/sev2026/t3/login",
    }),
  );
}

export async function sendManagerAssignmentEmail(
  employeeId: number,
  businessUnitId: number,
): Promise<boolean> {
  const businessUnit = await BusinessUnit.findByPk(businessUnitId);
  const businessName = (businessUnit as any)?.dataValues?.name?.trim() || "your business";
  const subject = `Congratulations on your promotion at ${businessName}`;
  const text = `Congratulations. You have been promoted to manager at ${businessName}.`;

  return sendEmailToEmployeeId(
    employeeId,
    subject,
    text,
    buildEmployeeEmailHtml({
      heading: `Congratulations! You have been added as a manager at ${businessName}`,
      body: "You now have manager access in the scheduling system. Click below to review your workspace and begin managing your team.",
      buttonLabel: "Click here to get started",
      buttonHref: "https://workerscheduling.eaglesoftwareteam.com/sev2026/t3/login",
    }),
  );
}

type AnnouncementEmailPayload = {
  subject: string;
  text: string;
  html?: string;
};

export async function sendAnnouncementEmailToEmployeeIds(
  employeeIds: number[],
  announcementId: number,
  payload: AnnouncementEmailPayload,
): Promise<void> {
  const attachments = await getAnnouncementAttachments(announcementId);
  const emails = await getEmailAddressesForEmployeeIds(employeeIds);
  await sendEmailToAddresses(emails, payload.subject, payload.text, payload.html, attachments);
}

export async function sendAnnouncementEmailToBusinessUnit(
  businessUnitId: number,
  announcementId: number,
  payload: AnnouncementEmailPayload,
): Promise<void> {
  const attachments = await getAnnouncementAttachments(announcementId);
  const emails = await getEmailAddressesForBusinessUnitEmployees(businessUnitId);
  await sendEmailToAddresses(emails, payload.subject, payload.text, payload.html, attachments);
}

async function sendEmailToAddresses(
  emails: string[],
  subject: string,
  text: string,
  html?: string,
  attachments?: SendMailOptions["attachments"],
): Promise<void> {
  const uniqueEmails = [...new Set(emails)];
  await Promise.allSettled(
    uniqueEmails.map((email) =>
      sendEmail({
        to: email,
        subject,
        text,
        html,
        attachments,
      }),
    ),
  );
}

async function getAnnouncementAttachments(announcementId: number): Promise<SendMailOptions["attachments"]> {
  const announcement = await Announcement.findByPk(announcementId, {
    include: [{
      model: AnnouncementFile,
      include: [File],
    }],
  });

  const announcementFiles = (announcement as any)?.dataValues?.announcementFiles;
  if (!Array.isArray(announcementFiles) || announcementFiles.length === 0) {
    return undefined;
  }

  const attachments = announcementFiles
    .map((announcementFile) => buildAttachmentFromAnnouncementFile(announcementFile))
    .filter((attachment): attachment is NonNullable<SendMailOptions["attachments"]>[number] => Boolean(attachment));

  return attachments.length > 0 ? attachments : undefined;
}

function buildAttachmentFromAnnouncementFile(announcementFile: any): NonNullable<SendMailOptions["attachments"]>[number] | null {
  const fileRecord = announcementFile?.dataValues?.file ?? announcementFile?.dataValues?.File;
  const rawFilePayload = fileRecord?.dataValues?.image;
  if (typeof rawFilePayload !== "string" || rawFilePayload.trim().length === 0) {
    return null;
  }

  const parsedPayload = parseStoredAttachmentPayload(rawFilePayload);
  if (!parsedPayload) {
    return null;
  }

  return {
    filename: parsedPayload.name,
    content: parsedPayload.buffer,
    contentType: parsedPayload.mimeType,
    contentDisposition: "attachment",
  };
}

function parseStoredAttachmentPayload(rawValue: string): { buffer: Buffer; name: string; mimeType: string } | null {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedValue) as { dataUrl?: string; name?: string; mimeType?: string };
    if (typeof parsed.dataUrl === "string" && parsed.dataUrl.length > 0) {
      const mimeType = parsed.mimeType?.trim() || inferMimeTypeFromDataUrl(parsed.dataUrl);
      return {
        buffer: dataUrlToBuffer(parsed.dataUrl),
        name: parsed.name?.trim() || getDefaultAttachmentName(mimeType),
        mimeType,
      };
    }
  } catch {
    // Fall back to treating the stored value as a raw data URL.
  }

  const mimeType = inferMimeTypeFromDataUrl(trimmedValue);
  return {
    buffer: dataUrlToBuffer(trimmedValue),
    name: getDefaultAttachmentName(mimeType),
    mimeType,
  };
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64Payload = dataUrl.replace(/^data:.*;base64,/, "");
  return Buffer.from(base64Payload, "base64");
}

function inferMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match?.[1] ?? "application/octet-stream";
}

function getDefaultAttachmentName(mimeType: string): string {
  if (mimeType === "application/pdf") {
    return "Attachment.pdf";
  }
  if (mimeType.startsWith("image/")) {
    const extension = mimeType.split("/")[1] ?? "png";
    return `Image.${extension}`;
  }
  return "Attachment";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmployeeEmailHtml(options: {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
}): string {
  const primary = "#48111c";
  const accent = "#d5dfe7";
  const background = "#f0f1f5";
  const surface = "#ffffff";
  const textColor = "#1a2433";
  const subtleText = "#5c6675";

  return `
    <div style="margin:0;padding:0;background:${background};font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:${surface};border:1px solid rgba(24,36,51,0.08);border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(24,36,51,0.08);">
          <div style="background:linear-gradient(135deg, ${primary} 0%, #5f1a29 100%);padding:28px 32px;text-align:center;">
            <h1 style="margin:18px 0 0 0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:700;">
              ${escapeHtml(options.heading)}
            </h1>
          </div>

          <div style="padding:36px 32px;text-align:center;color:${textColor};">
            <p style="margin:0 auto;max-width:500px;font-size:16px;line-height:1.7;color:${subtleText};">
              ${escapeHtml(options.body)}
            </p>

            <div style="margin-top:32px;">
              <a
                href="${options.buttonHref}"
                style="display:inline-block;background:${primary};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:0.01em;"
              >
                ${escapeHtml(options.buttonLabel)}
              </a>
            </div>

            <p style="margin:28px auto 0 auto;max-width:500px;font-size:13px;line-height:1.6;color:${subtleText};">
              If the button does not work, copy and paste this link into your browser:
              <br />
              <a href="${options.buttonHref}" style="color:${primary};word-break:break-all;">${escapeHtml(options.buttonHref)}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

