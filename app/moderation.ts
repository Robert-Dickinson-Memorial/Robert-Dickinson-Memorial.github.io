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
