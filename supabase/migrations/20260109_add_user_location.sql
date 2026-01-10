-- Add location tracking columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON profiles(country_code);

-- Add comment for documentation
COMMENT ON COLUMN profiles.country IS 'User country from IP geolocation';
COMMENT ON COLUMN profiles.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN profiles.city IS 'User city from IP geolocation';
COMMENT ON COLUMN profiles.timezone IS 'User timezone from IP geolocation';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last login';
COMMENT ON COLUMN profiles.last_login_ip IS 'IP address of last login';

