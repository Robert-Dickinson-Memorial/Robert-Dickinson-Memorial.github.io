-- Publish the family-provided event announcement once; later owner edits remain authoritative.
INSERT INTO events (title,start_at,end_at,location,description,link_label,link_url,published,created_at)
SELECT 'Celebrating a Life in Science','2026-10-09T15:00:00-07:00','2026-10-09T17:00:00-07:00','UCLA James West Alumni Center
325 Westwood Plaza
Los Angeles, CA 90095','Professor Robert E. Dickinson
26 March 1940 – 11 September 2026

Friday, October 9, 2026 · 3:00–5:00 p.m. Pacific Time
Reception to follow.

Parking: Lot 8 – Level 4.

For those who cannot attend in person, a live video stream will be available via the Zoom link below.

Honor Robert through a living tribute or a memory shared with his community:
https://robert-dickinson-memorial.github.io/

Download the event announcement (PDF):
https://robert-dickinson-memorial.github.io/celebrating-a-life-in-science.pdf','Join the Zoom livestream','https://ucla.zoom.us/j/95947455525',1,datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM events WHERE link_url='https://ucla.zoom.us/j/95947455525');
