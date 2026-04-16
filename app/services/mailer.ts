import nodemailer from "nodemailer";
import "dotenv/config";

import BusinessUnit from "../models/businessunit.model.ts";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";

type EmailContent = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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



async function sendEmail(content: EmailContent): Promise<boolean> {
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
  isManager: boolean,
): Promise<boolean> {
  const businessUnit = await BusinessUnit.findByPk(businessUnitId);
  const businessName = (businessUnit as any)?.dataValues?.name?.trim() || "your business";
  const subject = isManager
    ? `Manager access added for ${businessName}`
    : `Added to ${businessName}`;
  const text = isManager
    ? `You have been added as a manager for ${businessName}.`
    : `You have been added to ${businessName} as an employee.`;

  return sendEmailToEmployeeId(
    employeeId,
    subject,
    text,
    `<p>${escapeHtml(text)}</p>`,
  );
}

async function sendEmailToAddresses(
  emails: string[],
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const uniqueEmails = [...new Set(emails)];
  await Promise.allSettled(
    uniqueEmails.map((email) =>
      sendEmail({
        to: email,
        subject,
        text,
        html,
      }),
    ),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
