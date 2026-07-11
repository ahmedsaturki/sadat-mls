-- Update default notification_preferences to include email toggle keys
ALTER TABLE users
  ALTER COLUMN notification_preferences
  SET DEFAULT '{
    "contact_request": true,
    "agent_joined": true,
    "contact_request_email": true,
    "agent_joined_email": true,
    "saved_search_email": true,
    "property_status_email": true,
    "welcome_email": true
  }'::jsonb;
