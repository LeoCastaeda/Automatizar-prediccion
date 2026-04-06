-- Update any existing alert records that use the old CHANGE_% value
UPDATE Alert SET type = 'CHANGE_PERCENT' WHERE type = 'CHANGE_%';
