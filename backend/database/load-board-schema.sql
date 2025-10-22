-- TRUCKDOCS PRO LOAD BOARD - DATABASE SCHEMA
-- Complete freight marketplace with loads, bookings, and broker management

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ==================== LOADS TABLE ====================
CREATE TABLE IF NOT EXISTS loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- ORIGIN
    origin_city VARCHAR(255) NOT NULL,
    origin_state VARCHAR(2) NOT NULL,
    origin_zip VARCHAR(10),
    origin_address TEXT,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),

    -- DESTINATION
    destination_city VARCHAR(255) NOT NULL,
    destination_state VARCHAR(2) NOT NULL,
    destination_zip VARCHAR(10),
    destination_address TEXT,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),

    -- DATES & TIMES
    pickup_date DATE NOT NULL,
    pickup_time_start TIME,
    pickup_time_end TIME,
    delivery_date DATE,
    delivery_time_start TIME,
    delivery_time_end TIME,

    -- LOAD DETAILS
    equipment_type VARCHAR(50) NOT NULL, -- dry_van, reefer, flatbed, step_deck, lowboy, tanker, auto_carrier, dump, hopper, etc.
    weight DECIMAL(10, 2), -- pounds
    length DECIMAL(5, 2), -- feet
    commodity VARCHAR(255),
    load_number VARCHAR(100),

    -- PRICING
    rate_per_mile DECIMAL(10, 2),
    total_rate DECIMAL(10, 2) NOT NULL,
    distance_miles INTEGER,
    fuel_surcharge DECIMAL(10, 2) DEFAULT 0,

    -- BROKER/COMPANY INFO
    broker_company VARCHAR(255),
    broker_mc_number VARCHAR(100),
    broker_dot_number VARCHAR(100),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),

    -- REQUIREMENTS
    requires_hazmat BOOLEAN DEFAULT FALSE,
    requires_team_driver BOOLEAN DEFAULT FALSE,
    requires_tsa BOOLEAN DEFAULT FALSE,
    requires_twic BOOLEAN DEFAULT FALSE,
    age_requirement INTEGER, -- minimum driver age

    -- ADDITIONAL INFO
    notes TEXT,
    special_instructions TEXT,
    stops INTEGER DEFAULT 0, -- number of stops

    -- STATUS & VISIBILITY
    status VARCHAR(50) DEFAULT 'available', -- available, booked, in_transit, delivered, completed, cancelled, expired
    is_featured BOOLEAN DEFAULT FALSE, -- premium feature
    is_verified BOOLEAN DEFAULT FALSE, -- admin verified
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    -- EXTERNAL API (for future DAT/Truckstop integration)
    external_load_id VARCHAR(255),
    external_source VARCHAR(50), -- dat, truckstop, internal

    -- TIMESTAMPS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CONSTRAINTS
    CONSTRAINT positive_rate CHECK (total_rate > 0),
    CONSTRAINT valid_equipment CHECK (equipment_type IN (
        'dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy',
        'tanker', 'auto_carrier', 'dump', 'hopper', 'conestoga',
        'hot_shot', 'cargo_van', 'sprinter', 'box_truck', 'power_only'
    ))
);

-- ==================== LOAD BOOKINGS ====================
CREATE TABLE IF NOT EXISTS load_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- BOOKING STATUS
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, rejected, in_transit, delivered, completed, cancelled

    -- RATE CONFIRMATION
    agreed_rate DECIMAL(10, 2) NOT NULL,
    rate_confirmation_number VARCHAR(100),

    -- DRIVER INFO
    truck_number VARCHAR(100),
    trailer_number VARCHAR(100),
    driver_license VARCHAR(50),

    -- DOCUMENTATION
    bol_number VARCHAR(100), -- Bill of Lading
    pickup_signature TEXT, -- base64 signature
    delivery_signature TEXT, -- base64 signature
    pod_url VARCHAR(500), -- Proof of Delivery document
    rate_con_url VARCHAR(500), -- Rate Confirmation document

    -- TIMESTAMPS
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- CANCELLATION
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,

    -- PAYMENT
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, pending, paid
    payment_date DATE,
    invoice_id UUID REFERENCES invoices(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SAVED SEARCHES ====================
CREATE TABLE IF NOT EXISTS load_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- SEARCH CRITERIA
    search_name VARCHAR(255) NOT NULL,
    origin_city VARCHAR(255),
    origin_state VARCHAR(2),
    origin_radius INTEGER DEFAULT 50, -- miles
    destination_city VARCHAR(255),
    destination_state VARCHAR(2),
    destination_radius INTEGER DEFAULT 50,
    equipment_types TEXT[], -- array of equipment types
    min_rate DECIMAL(10, 2),
    max_deadhead INTEGER, -- max empty miles from current location
    min_weight DECIMAL(10, 2),
    max_weight DECIMAL(10, 2),

    -- NOTIFICATIONS
    notify_email BOOLEAN DEFAULT TRUE,
    notify_sms BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== BROKER PROFILES ====================
CREATE TABLE IF NOT EXISTS broker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- COMPANY INFO
    company_name VARCHAR(255) NOT NULL,
    mc_number VARCHAR(100) NOT NULL UNIQUE,
    dot_number VARCHAR(100),
    scac_code VARCHAR(10), -- Standard Carrier Alpha Code

    -- VERIFICATION
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    verification_method VARCHAR(50), -- manual, fmcsa_api, document_upload

    -- CONTACT
    office_phone VARCHAR(20),
    after_hours_phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),

    -- ADDRESS
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(2),
    zip VARCHAR(10),

    -- RATING & REPUTATION
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    on_time_payment_score INTEGER DEFAULT 100, -- 0-100

    -- PERFORMANCE METRICS
    loads_posted INTEGER DEFAULT 0,
    loads_completed INTEGER DEFAULT 0,
    total_volume DECIMAL(15, 2) DEFAULT 0, -- total $ in completed loads

    -- PAYMENT INFO
    payment_terms INTEGER DEFAULT 30, -- days
    quick_pay_available BOOLEAN DEFAULT FALSE,
    quick_pay_fee DECIMAL(5, 2), -- percentage

    -- INSURANCE
    cargo_insurance_amount DECIMAL(12, 2),
    liability_insurance_amount DECIMAL(12, 2),
    insurance_expiration DATE,

    -- PREFERENCES
    preferred_lanes TEXT[], -- array of origin-destination pairs
    service_areas TEXT[], -- states they service

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== REVIEWS & RATINGS ====================
CREATE TABLE IF NOT EXISTS load_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES load_bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_type VARCHAR(20) NOT NULL, -- driver, broker

    -- OVERALL RATING
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,

    -- DETAILED RATINGS
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    payment_timeliness_rating INTEGER CHECK (payment_timeliness_rating >= 1 AND payment_timeliness_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),

    -- RESPONSE
    response_text TEXT,
    response_date TIMESTAMP,

    -- FLAGS
    is_verified_load BOOLEAN DEFAULT TRUE, -- actually completed the load
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- UNIQUE CONSTRAINT: One review per booking per user
    UNIQUE(booking_id, reviewer_id)
);

-- ==================== LOAD VIEWS (Analytics) ====================
CREATE TABLE IF NOT EXISTS load_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Loads indexes
CREATE INDEX IF NOT EXISTS idx_loads_broker ON loads(broker_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_equipment ON loads(equipment_type);
CREATE INDEX IF NOT EXISTS idx_loads_origin_state ON loads(origin_state);
CREATE INDEX IF NOT EXISTS idx_loads_dest_state ON loads(destination_state);
CREATE INDEX IF NOT EXISTS idx_loads_rate ON loads(rate_per_mile);
CREATE INDEX IF NOT EXISTS idx_loads_posted_at ON loads(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_loads_featured ON loads(is_featured) WHERE is_featured = TRUE;

-- Composite indexes for common searches
CREATE INDEX IF NOT EXISTS idx_loads_search ON loads(origin_state, destination_state, equipment_type, status);
CREATE INDEX IF NOT EXISTS idx_loads_location ON loads(origin_city, origin_state, destination_city, destination_state);

-- GIS indexes for proximity search (if using PostGIS)
CREATE INDEX IF NOT EXISTS idx_loads_origin_coords ON loads(origin_lat, origin_lng);
CREATE INDEX IF NOT EXISTS idx_loads_dest_coords ON loads(destination_lat, destination_lng);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_load ON load_bookings(load_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON load_bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_broker ON load_bookings(broker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON load_bookings(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON load_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON load_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON load_reviews(rating);

-- Broker profiles indexes
CREATE INDEX IF NOT EXISTS idx_broker_mc ON broker_profiles(mc_number);
CREATE INDEX IF NOT EXISTS idx_broker_verified ON broker_profiles(is_verified);

-- Saved searches indexes
CREATE INDEX IF NOT EXISTS idx_searches_user ON load_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_active ON load_searches(is_active) WHERE is_active = TRUE;

-- ==================== TRIGGERS ====================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_load_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loads_updated_at
    BEFORE UPDATE ON loads
    FOR EACH ROW
    EXECUTE FUNCTION update_load_updated_at();

CREATE TRIGGER trigger_bookings_updated_at
    BEFORE UPDATE ON load_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_load_updated_at();

-- Update broker stats when booking status changes
CREATE OR REPLACE FUNCTION update_broker_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE broker_profiles
        SET loads_completed = loads_completed + 1,
            total_volume = total_volume + NEW.agreed_rate
        WHERE user_id = NEW.broker_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_broker_stats
    AFTER UPDATE ON load_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_broker_stats();

-- Update load status when booked
CREATE OR REPLACE FUNCTION update_load_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE loads SET status = 'booked' WHERE id = NEW.load_id;
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE loads SET status = 'available' WHERE id = NEW.load_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_load_status_on_booking
    AFTER UPDATE ON load_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_load_status_on_booking();

-- ==================== VIEWS FOR REPORTING ====================

-- Active loads view
CREATE OR REPLACE VIEW active_loads_view AS
SELECT
    l.*,
    bp.company_name as broker_company_name,
    bp.average_rating as broker_rating,
    bp.on_time_payment_score,
    (SELECT COUNT(*) FROM load_views WHERE load_id = l.id) as view_count
FROM loads l
LEFT JOIN broker_profiles bp ON l.broker_id = bp.user_id
WHERE l.status = 'available'
  AND (l.expires_at IS NULL OR l.expires_at > CURRENT_TIMESTAMP);

-- Broker performance view
CREATE OR REPLACE VIEW broker_performance_view AS
SELECT
    bp.*,
    u.email,
    u.full_name as contact_name,
    COUNT(DISTINCT l.id) as total_loads_posted,
    COUNT(DISTINCT lb.id) as total_bookings,
    AVG(CASE WHEN lb.status = 'completed' THEN lr.rating END) as avg_driver_rating
FROM broker_profiles bp
JOIN users u ON bp.user_id = u.id
LEFT JOIN loads l ON bp.user_id = l.broker_id
LEFT JOIN load_bookings lb ON l.id = lb.load_id
LEFT JOIN load_reviews lr ON lb.id = lr.booking_id AND lr.reviewer_type = 'driver'
GROUP BY bp.id, u.email, u.full_name;
