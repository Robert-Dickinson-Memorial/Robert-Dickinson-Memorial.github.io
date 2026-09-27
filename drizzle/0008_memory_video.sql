ALTER TABLE memories ADD COLUMN video_key text;
ALTER TABLE memories ADD COLUMN video_name text;
UPDATE site_content SET value = '(optional if you share a PDF, video, or public post)' WHERE key = 'memories.formStoryNote';
UPDATE site_content SET value = 'I give permission for this story, photo, PDF, video, and/or shared public link to be published on this memorial site after review.' WHERE key = 'memories.formConsent';
