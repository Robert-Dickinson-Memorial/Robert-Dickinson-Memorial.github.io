-- Remove only the announcement attachment from the owner-editable event.
UPDATE events SET description = rtrim(replace(description, 'Download the event announcement (PDF):' || char(10) || 'https://robert-dickinson-memorial.github.io/celebrating-a-life-in-science.pdf', ''), char(10) || char(13) || ' ') WHERE id = 1;
