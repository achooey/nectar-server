CREATE TABLE PromoCodes (
    id SERIAL PRIMARY KEY,
    website TEXT NOT NULL,
    code TEXT NOT NULL
    last_successful TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_promocodes_website ON PromoCodes (website);

CREATE TABLE AttemptHistory (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Capture timezone information
    website TEXT NOT NULL,
    code TEXT NOT NULL,
    result TEXT NOT NULL
);
CREATE INDEX idx_attempthistory_code_website ON AttemptHistory (code, website);
