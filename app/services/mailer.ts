import nodemailer, { type SendMailOptions } from "nodemailer";
import "dotenv/config";

import BusinessUnit from "../models/businessunit.model.ts";
import Announcement from "../models/announcement.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import File from "../models/file.model.ts";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";

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
    console.error("Email error:", error);
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
  const subject = `Added to ${businessName}`;
  const text = `You have been added to ${businessName} as an employee.`;

  return sendEmailToEmployeeId(
    employeeId,
    subject,
    text,
    `<p>${escapeHtml(text)}</p>`,
  );
}

export async function sendManagerAssignmentEmail(
  employeeId: number,
  businessUnitId: number,
): Promise<boolean> {
  const businessUnit = await BusinessUnit.findByPk(businessUnitId);
  const businessName = (businessUnit as any)?.dataValues?.name?.trim() || "your business";
  const subject = `Manager access added for ${businessName}`;
  const text = `You have been added as a manager for ${businessName}.`;

  return sendEmailToEmployeeId(
    employeeId,
    subject,
    text,
    `<p>${escapeHtml(text)}</p>`,
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
  const rawFilePayload = announcementFile?.dataValues?.file?.dataValues?.image;
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
