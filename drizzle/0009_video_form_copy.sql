UPDATE site_content SET value = json_set(value, '$."memories.formStoryNote"', '(optional if you share a PDF, video, or public post)')
WHERE key = 'pageCopy' AND json_valid(value) AND json_extract(value, '$."memories.formStoryNote"') = '(optional if you share a PDF or public post)';
UPDATE site_content SET value = json_set(value, '$."memories.formConsent"', 'I give permission for this story, photo, PDF, video, and/or shared public link to be published on this memorial site after review.')
WHERE key = 'pageCopy' AND json_valid(value) AND json_extract(value, '$."memories.formConsent"') = 'I give permission for this story, photo, PDF, and/or shared public link to be published on this memorial site after review.';
