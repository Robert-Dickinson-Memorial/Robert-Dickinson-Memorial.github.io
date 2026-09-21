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
  return Boolean(runtimeValue("RESEND_API_KEY") && runtimeValue("REVIEW_NOTIFICATION_TO"));
}

export async function sendReviewNotification(input: {
  name: string;
  relationship: string;
  title: string;
  reviewUrl: string;
}): Promise<boolean> {
  const apiKey = runtimeValue("RESEND_API_KEY");
  const to = runtimeValue("REVIEW_NOTIFICATION_TO");
  if (!apiKey || !to) return false;

  const from = runtimeValue("REVIEW_NOTIFICATION_FROM") || "Memorial Review <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((value) => value.trim()).filter(Boolean),
      subject: `New memorial submission: ${input.title}`,
      text: [
        "A new memory has been submitted for review.",
        "",
        `Title: ${input.title}`,
        `Submitted by: ${input.name}`,
        `Connection: ${input.relationship}`,
        "",
        `Review it here: ${input.reviewUrl}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn("Review notification failed", response.status, detail.slice(0, 500));
    return false;
  }
  return true;
}

export async function sendEditorInvitation(input: {
  email: string;
  displayName: string;
  manageUrl: string;
}): Promise<boolean> {
  const apiKey = runtimeValue("RESEND_API_KEY");
  if (!apiKey) return false;

  const from = runtimeValue("REVIEW_NOTIFICATION_FROM") || "Robert Dickinson Memorial <onboarding@resend.dev>";
  const greeting = input.displayName ? `Dear ${input.displayName},` : "Hello,";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
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
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn("Editor invitation failed", response.status, detail.slice(0, 500));
    return false;
  }
  return true;
}
