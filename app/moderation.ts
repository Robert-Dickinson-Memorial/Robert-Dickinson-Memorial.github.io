import { env } from "cloudflare:workers";

function runtimeValue(key: string): string {
  const runtime = env as unknown as Record<string, string | undefined>;
  return runtime[key]?.trim() ?? "";
}

function emailList(key: string): string[] {
  return runtimeValue(key)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function requestUserEmail(request: Request): string | null {
  return request.headers.get("cf-access-authenticated-user-email") || request.headers.get("oai-authenticated-user-email");
}

export function isOwnerEmail(email: string): boolean {
  const allowed = [...emailList("OWNER_EMAILS"), ...emailList("REVIEWER_EMAILS"), ...emailList("MODERATOR_EMAILS")];
  return allowed.includes(email.trim().toLowerCase());
}

export async function isEditorEmail(email: string): Promise<boolean> {
  if (isOwnerEmail(email)) return true;
  if (!env.DB) return false;
  try {
    const editor = await env.DB.prepare("SELECT email FROM memorial_editors WHERE lower(email) = ? LIMIT 1").bind(email.trim().toLowerCase()).first();
    return Boolean(editor);
  } catch {
    return emailList("EDITOR_EMAILS").includes(email.trim().toLowerCase());
  }
}

export function isOwnerRequest(request: Request): boolean {
  const email = requestUserEmail(request);
  return Boolean(email && isOwnerEmail(email));
}

export async function isEditorRequest(request: Request): Promise<boolean> {
  const email = requestUserEmail(request);
  return Boolean(email && await isEditorEmail(email));
}

export function emailNotificationsConfigured(): boolean {
  const mailProviderReady = Boolean(
    (runtimeValue("BREVO_API_KEY") && runtimeValue("NOTIFICATION_FROM_EMAIL")) ||
    runtimeValue("RESEND_API_KEY")
  );
  return Boolean(mailProviderReady && runtimeValue("REVIEW_NOTIFICATION_TO"));
}

async function sendTransactionalEmail(input: { to: string[]; subject: string; text: string }): Promise<boolean> {
  const brevoApiKey = runtimeValue("BREVO_API_KEY");
  const senderEmail = runtimeValue("NOTIFICATION_FROM_EMAIL");
  if (brevoApiKey && senderEmail) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoApiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: runtimeValue("NOTIFICATION_FROM_NAME") || "Robert Dickinson Memorial" },
        to: input.to.map((email) => ({ email })),
        subject: input.subject,
        textContent: input.text,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.warn("Brevo email failed", response.status, detail.slice(0, 500));
      return false;
    }
    return true;
  }

  const resendApiKey = runtimeValue("RESEND_API_KEY");
  if (!resendApiKey) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${resendApiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: runtimeValue("REVIEW_NOTIFICATION_FROM") || "Robert Dickinson Memorial <onboarding@resend.dev>",
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.warn("Resend email failed", response.status, detail.slice(0, 500));
    return false;
  }
  return true;
}

export async function sendReviewNotification(input: {
  name: string;
  relationship: string;
  title: string;
  reviewUrl: string;
}): Promise<boolean> {
  const to = runtimeValue("REVIEW_NOTIFICATION_TO");
  if (!to) return false;
  return sendTransactionalEmail({
    to: to.split(",").map((value) => value.trim()).filter(Boolean),
    subject: `New memorial submission: ${input.title}`,
    text: [
      "A new memory has been submitted for review.",
      "",
      `Title: ${input.title}`,
      `Submitted by: ${input.name}`,
      `Connection: ${input.relationship}`,
      "",
      "The submission may include written text, a photo, a PDF, and/or a public link.",
      "",
      `Review it here: ${input.reviewUrl}`,
    ].join("\n"),
  });
}

export async function sendEditorInvitation(input: {
  email: string;
  displayName: string;
  manageUrl: string;
}): Promise<boolean> {
  const greeting = input.displayName ? `Dear ${input.displayName},` : "Hello,";
  return sendTransactionalEmail({
    to: [input.email],
    subject: "You are invited to edit the Robert Dickinson Memorial",
    text: [
      greeting,
      "",
      "You have been granted editor access to the Robert Dickinson Memorial website.",
      "",
      "How to sign in:",
      `1. Open ${input.manageUrl}`,
      `2. Enter this email address: ${input.email}`,
      "3. Cloudflare will email you a one-time verification code.",
      "4. Enter the code to open the private management dashboard.",
      "",
      "As an editor, you can update memorial text, events, photos and videos; review and approve or reject submitted memories; and remove published memory text or photographs.",
      "",
      "Important: the memorial owner must also add this exact email address to the Cloudflare Access Editors policy. If Cloudflare denies access, please contact the memorial owner.",
      "",
      "Robert Dickinson Memorial",
    ].join("\n"),
  });
}
