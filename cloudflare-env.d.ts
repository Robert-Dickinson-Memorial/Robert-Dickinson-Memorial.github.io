declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OWNER_EMAILS?: string;
    PUBLIC_SITE_ORIGIN?: string;
  }
}
