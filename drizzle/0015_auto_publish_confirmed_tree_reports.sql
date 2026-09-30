-- Living Tribute now uses an honor system. Confirmed historical reports should
-- join the public totals immediately; incorrect records can still be voided later.
UPDATE `tree_dedications`
SET `status` = 'approved'
WHERE `status` = 'pending' AND `payment_confirmed` = 1;
