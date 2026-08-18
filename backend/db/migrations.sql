-- PostgreSQL database migration schema for user corrections learning

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint VARCHAR(64),                                   -- SHA-256 hash of the uploaded document (identifies uniqueness)
    field VARCHAR(50) NOT NULL,                                -- Form field key (e.g., 'eventTitle', 'venue')
    predicted TEXT NOT NULL,                                   -- Value guessed by the OCR layout processor
    corrected TEXT NOT NULL,                                   -- Final value corrected and approved by the user
    occurrence_count INT DEFAULT 1,                            -- Weight of correction occurrences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique index constraints to perform upserts (ON CONFLICT DO UPDATE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_correction 
ON user_corrections (fingerprint, field, LOWER(predicted));

CREATE INDEX IF NOT EXISTS idx_fingerprint_lookup 
ON user_corrections (fingerprint);

CREATE INDEX IF NOT EXISTS idx_field_predicted 
ON user_corrections (field, predicted);

-- Trigger function to auto-update update timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE OR REPLACE TRIGGER update_user_corrections_modtime
    BEFORE UPDATE ON user_corrections
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
