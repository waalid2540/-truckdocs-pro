-- IFTA Tax Rates Table
-- Stores per-gallon tax rates for all IFTA jurisdictions (US states + Canadian provinces)
-- Rates updated as of 2024-2025

CREATE TABLE IF NOT EXISTS ifta_tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction VARCHAR(2) NOT NULL, -- State/Province code (e.g., 'CA', 'TX', 'ON', 'BC')
    jurisdiction_name VARCHAR(100) NOT NULL, -- Full name
    fuel_type VARCHAR(20) NOT NULL DEFAULT 'diesel', -- diesel, gasoline
    tax_rate DECIMAL(10, 4) NOT NULL, -- Tax per gallon in USD
    effective_date DATE NOT NULL, -- When this rate became effective
    end_date DATE, -- When this rate expires (NULL if current)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jurisdiction, fuel_type, effective_date)
);

-- Index for fast lookups
CREATE INDEX idx_ifta_tax_rates_jurisdiction ON ifta_tax_rates(jurisdiction, fuel_type, is_active);

-- Populate with 2024-2025 IFTA tax rates for diesel fuel (most common for trucks)
-- Source: IFTA official rates as of 2024

INSERT INTO ifta_tax_rates (jurisdiction, jurisdiction_name, fuel_type, tax_rate, effective_date, is_active) VALUES
-- United States
('AL', 'Alabama', 'diesel', 0.2900, '2024-01-01', true),
('AK', 'Alaska', 'diesel', 0.0950, '2024-01-01', true),
('AZ', 'Arizona', 'diesel', 0.2600, '2024-01-01', true),
('AR', 'Arkansas', 'diesel', 0.2450, '2024-01-01', true),
('CA', 'California', 'diesel', 0.5380, '2024-07-01', true), -- CA has highest tax
('CO', 'Colorado', 'diesel', 0.2050, '2024-01-01', true),
('CT', 'Connecticut', 'diesel', 0.4940, '2024-07-01', true),
('DE', 'Delaware', 'diesel', 0.2200, '2024-01-01', true),
('FL', 'Florida', 'diesel', 0.3110, '2024-01-01', true),
('GA', 'Georgia', 'diesel', 0.3290, '2024-07-01', true),
('HI', 'Hawaii', 'diesel', 0.1700, '2024-01-01', true),
('ID', 'Idaho', 'diesel', 0.3200, '2024-07-01', true),
('IL', 'Illinois', 'diesel', 0.5460, '2024-07-01', true), -- High tax state
('IN', 'Indiana', 'diesel', 0.5400, '2024-07-01', true),
('IA', 'Iowa', 'diesel', 0.3330, '2024-03-01', true),
('KS', 'Kansas', 'diesel', 0.2600, '2024-07-01', true),
('KY', 'Kentucky', 'diesel', 0.2670, '2024-01-01', true),
('LA', 'Louisiana', 'diesel', 0.2010, '2024-01-01', true),
('ME', 'Maine', 'diesel', 0.3140, '2024-01-01', true),
('MD', 'Maryland', 'diesel', 0.3870, '2024-07-01', true),
('MA', 'Massachusetts', 'diesel', 0.2400, '2024-01-01', true),
('MI', 'Michigan', 'diesel', 0.2790, '2024-01-01', true),
('MN', 'Minnesota', 'diesel', 0.2860, '2024-01-01', true),
('MS', 'Mississippi', 'diesel', 0.1840, '2024-01-01', true),
('MO', 'Missouri', 'diesel', 0.1700, '2024-10-01', true),
('MT', 'Montana', 'diesel', 0.3220, '2024-07-01', true),
('NE', 'Nebraska', 'diesel', 0.2930, '2024-01-01', true),
('NV', 'Nevada', 'diesel', 0.2750, '2024-07-01', true),
('NH', 'New Hampshire', 'diesel', 0.2420, '2024-07-01', true),
('NJ', 'New Jersey', 'diesel', 0.3560, '2024-10-01', true),
('NM', 'New Mexico', 'diesel', 0.2288, '2024-07-01', true),
('NY', 'New York', 'diesel', 0.4575, '2024-01-01', true),
('NC', 'North Carolina', 'diesel', 0.4050, '2024-07-01', true),
('ND', 'North Dakota', 'diesel', 0.2300, '2024-01-01', true),
('OH', 'Ohio', 'diesel', 0.4700, '2024-07-01', true),
('OK', 'Oklahoma', 'diesel', 0.2000, '2024-01-01', true),
('OR', 'Oregon', 'diesel', 0.3800, '2024-01-01', true),
('PA', 'Pennsylvania', 'diesel', 0.7770, '2024-01-01', true), -- Highest in nation
('RI', 'Rhode Island', 'diesel', 0.3500, '2024-07-01', true),
('SC', 'South Carolina', 'diesel', 0.2700, '2024-07-01', true),
('SD', 'South Dakota', 'diesel', 0.3000, '2024-04-01', true),
('TN', 'Tennessee', 'diesel', 0.2840, '2024-07-01', true),
('TX', 'Texas', 'diesel', 0.2000, '2024-01-01', true),
('UT', 'Utah', 'diesel', 0.3650, '2024-07-01', true),
('VT', 'Vermont', 'diesel', 0.3310, '2024-07-01', true),
('VA', 'Virginia', 'diesel', 0.2920, '2024-07-01', true),
('WA', 'Washington', 'diesel', 0.5380, '2024-01-01', true),
('WV', 'West Virginia', 'diesel', 0.3570, '2024-07-01', true),
('WI', 'Wisconsin', 'diesel', 0.3290, '2024-04-01', true),
('WY', 'Wyoming', 'diesel', 0.2400, '2024-07-01', true),

-- Canadian Provinces (IFTA members)
('AB', 'Alberta', 'diesel', 0.0900, '2024-01-01', true),
('BC', 'British Columbia', 'diesel', 0.1500, '2024-01-01', true),
('MB', 'Manitoba', 'diesel', 0.1100, '2024-04-01', true),
('NB', 'New Brunswick', 'diesel', 0.1530, '2024-07-01', true),
('NL', 'Newfoundland and Labrador', 'diesel', 0.1650, '2024-01-01', true),
('NT', 'Northwest Territories', 'diesel', 0.1070, '2024-01-01', true),
('NS', 'Nova Scotia', 'diesel', 0.1540, '2024-07-01', true),
('NU', 'Nunavut', 'diesel', 0.0640, '2024-01-01', true),
('ON', 'Ontario', 'diesel', 0.1430, '2024-07-01', true),
('PE', 'Prince Edward Island', 'diesel', 0.1740, '2024-04-01', true),
('QC', 'Quebec', 'diesel', 0.2020, '2024-01-01', true),
('SK', 'Saskatchewan', 'diesel', 0.1500, '2024-04-01', true),
('YT', 'Yukon', 'diesel', 0.0740, '2024-04-01', true);

-- Also add gasoline rates (less common for commercial trucks, but some use it)
INSERT INTO ifta_tax_rates (jurisdiction, jurisdiction_name, fuel_type, tax_rate, effective_date, is_active) VALUES
('AL', 'Alabama', 'gasoline', 0.2900, '2024-01-01', true),
('AK', 'Alaska', 'gasoline', 0.0895, '2024-01-01', true),
('AZ', 'Arizona', 'gasoline', 0.1800, '2024-01-01', true),
('AR', 'Arkansas', 'gasoline', 0.2450, '2024-01-01', true),
('CA', 'California', 'gasoline', 0.5790, '2024-07-01', true),
('CO', 'Colorado', 'gasoline', 0.2200, '2024-01-01', true),
('CT', 'Connecticut', 'gasoline', 0.2500, '2024-01-01', true),
('DE', 'Delaware', 'gasoline', 0.2300, '2024-01-01', true),
('FL', 'Florida', 'gasoline', 0.2690, '2024-01-01', true),
('GA', 'Georgia', 'gasoline', 0.3370, '2024-01-01', true),
('HI', 'Hawaii', 'gasoline', 0.1700, '2024-01-01', true),
('ID', 'Idaho', 'gasoline', 0.3200, '2024-07-01', true),
('IL', 'Illinois', 'gasoline', 0.4740, '2024-07-01', true),
('IN', 'Indiana', 'gasoline', 0.5600, '2024-07-01', true),
('IA', 'Iowa', 'gasoline', 0.3090, '2024-03-01', true),
('KS', 'Kansas', 'gasoline', 0.2400, '2024-07-01', true),
('KY', 'Kentucky', 'gasoline', 0.2600, '2024-01-01', true),
('LA', 'Louisiana', 'gasoline', 0.2010, '2024-01-01', true),
('ME', 'Maine', 'gasoline', 0.3050, '2024-01-01', true),
('MD', 'Maryland', 'gasoline', 0.4760, '2024-07-01', true),
('MA', 'Massachusetts', 'gasoline', 0.2400, '2024-01-01', true),
('MI', 'Michigan', 'gasoline', 0.2830, '2024-01-01', true),
('MN', 'Minnesota', 'gasoline', 0.2860, '2024-01-01', true),
('MS', 'Mississippi', 'gasoline', 0.1840, '2024-01-01', true),
('MO', 'Missouri', 'gasoline', 0.1700, '2024-10-01', true),
('MT', 'Montana', 'gasoline', 0.3370, '2024-01-01', true),
('NE', 'Nebraska', 'gasoline', 0.2910, '2024-01-01', true),
('NV', 'Nevada', 'gasoline', 0.2350, '2024-07-01', true),
('NH', 'New Hampshire', 'gasoline', 0.2380, '2024-07-01', true),
('NJ', 'New Jersey', 'gasoline', 0.4240, '2024-01-01', true),
('NM', 'New Mexico', 'gasoline', 0.1875, '2024-07-01', true),
('NY', 'New York', 'gasoline', 0.4525, '2024-01-01', true),
('NC', 'North Carolina', 'gasoline', 0.4050, '2024-07-01', true),
('ND', 'North Dakota', 'gasoline', 0.2300, '2024-01-01', true),
('OH', 'Ohio', 'gasoline', 0.4700, '2024-07-01', true),
('OK', 'Oklahoma', 'gasoline', 0.2000, '2024-01-01', true),
('OR', 'Oregon', 'gasoline', 0.3800, '2024-01-01', true),
('PA', 'Pennsylvania', 'gasoline', 0.5770, '2024-01-01', true),
('RI', 'Rhode Island', 'gasoline', 0.3500, '2024-07-01', true),
('SC', 'South Carolina', 'gasoline', 0.2800, '2024-07-01', true),
('SD', 'South Dakota', 'gasoline', 0.3000, '2024-04-01', true),
('TN', 'Tennessee', 'gasoline', 0.2700, '2024-07-01', true),
('TX', 'Texas', 'gasoline', 0.2000, '2024-01-01', true),
('UT', 'Utah', 'gasoline', 0.3670, '2024-07-01', true),
('VT', 'Vermont', 'gasoline', 0.3100, '2024-07-01', true),
('VA', 'Virginia', 'gasoline', 0.2920, '2024-07-01', true),
('WA', 'Washington', 'gasoline', 0.4940, '2024-01-01', true),
('WV', 'West Virginia', 'gasoline', 0.3570, '2024-07-01', true),
('WI', 'Wisconsin', 'gasoline', 0.3290, '2024-04-01', true),
('WY', 'Wyoming', 'gasoline', 0.2400, '2024-07-01', true),

-- Canadian provinces gasoline
('AB', 'Alberta', 'gasoline', 0.0900, '2024-01-01', true),
('BC', 'British Columbia', 'gasoline', 0.1450, '2024-01-01', true),
('MB', 'Manitoba', 'gasoline', 0.1400, '2024-04-01', true),
('NB', 'New Brunswick', 'gasoline', 0.1550, '2024-07-01', true),
('NL', 'Newfoundland and Labrador', 'gasoline', 0.1650, '2024-01-01', true),
('NT', 'Northwest Territories', 'gasoline', 0.1070, '2024-01-01', true),
('NS', 'Nova Scotia', 'gasoline', 0.1550, '2024-07-01', true),
('NU', 'Nunavut', 'gasoline', 0.0640, '2024-01-01', true),
('ON', 'Ontario', 'gasoline', 0.1470, '2024-07-01', true),
('PE', 'Prince Edward Island', 'gasoline', 0.1780, '2024-04-01', true),
('QC', 'Quebec', 'gasoline', 0.1920, '2024-01-01', true),
('SK', 'Saskatchewan', 'gasoline', 0.1500, '2024-04-01', true),
('YT', 'Yukon', 'gasoline', 0.0620, '2024-04-01', true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ifta_tax_rates_updated_at BEFORE UPDATE ON ifta_tax_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
