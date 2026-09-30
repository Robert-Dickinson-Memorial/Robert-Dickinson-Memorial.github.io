-- Date and time now render from the owner-editable structured event fields.
UPDATE events SET description = replace(description, 'Friday, October 9, 2026 · 3:00–5:00 p.m. Pacific Time' || char(10), '') WHERE link_url = 'https://ucla.zoom.us/j/95947455525';
