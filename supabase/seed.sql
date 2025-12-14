-- Seed Data for Right Time Parts Tracker
-- Run this AFTER creating users in Supabase Auth
-- 
-- INSTRUCTIONS:
-- 1. First, create two users in Supabase Dashboard > Authentication > Users:
--    - boss@example.com (password: Password123!)
--    - staff@example.com (password: Password123!)
-- 2. Copy their user IDs from the dashboard
-- 3. Replace the placeholder UUIDs below with the actual user IDs
-- 4. Run this script in the SQL Editor

-- Replace these with actual user IDs from Supabase Auth
-- You can find them in Authentication > Users in the Supabase Dashboard
DO $$
DECLARE
    boss_user_id UUID := 'BOSS UUID'; -- Replace with actual boss user ID
    staff_user_id UUID := 'STAFF UUID'; -- Replace with actual staff user ID
    request1_id UUID;
    request2_id UUID;
BEGIN
    -- Insert user roles
    INSERT INTO user_roles (user_id, role) VALUES 
        (boss_user_id, 'boss'),
        (staff_user_id, 'staff')
    ON CONFLICT (user_id) DO NOTHING;

    -- Create sample requests
    INSERT INTO requests (id, created_by, notes)
    VALUES (uuid_generate_v4(), staff_user_id, 'Urgent parts needed for Job 2024-001')
    RETURNING id INTO request1_id;

    INSERT INTO requests (id, created_by, notes)
    VALUES (uuid_generate_v4(), staff_user_id, 'Regular maintenance parts')
    RETURNING id INTO request2_id;

    -- Create sample request items for first request
    INSERT INTO request_items (request_id, job_bag_number, manufacturer, part_name, description, quantity, boss_status, staff_status, created_by)
    VALUES 
        (request1_id, 'JB-2024-001', 'Bosch', 'Brake Pads', 'Front brake pads, ceramic', 2, 'ordered', NULL, staff_user_id),
        (request1_id, 'JB-2024-001', 'NGK', 'Spark Plugs', 'Iridium spark plugs', 4, 'ordered', 'received', staff_user_id),
        (request1_id, 'JB-2024-001', 'Denso', 'Oxygen Sensor', 'Downstream O2 sensor', 1, 'backorder', NULL, staff_user_id),
        (request1_id, 'JB-2024-002', 'AC Delco', 'Oil Filter', NULL, 1, NULL, NULL, staff_user_id);

    -- Create sample request items for second request
    INSERT INTO request_items (request_id, job_bag_number, manufacturer, part_name, description, quantity, boss_status, staff_status, created_by)
    VALUES 
        (request2_id, 'JB-2024-003', 'Motorcraft', 'Air Filter', 'Engine air filter', 1, 'ordered', 'received', staff_user_id),
        (request2_id, 'JB-2024-003', 'Mopar', 'Transmission Fluid', 'ATF+4', 6, 'discontinued', NULL, staff_user_id),
        (request2_id, 'JB-2024-004', 'Gates', 'Serpentine Belt', '6-rib belt, 85 inches', 1, NULL, NULL, staff_user_id);

    RAISE NOTICE 'Seed data inserted successfully!';
END $$;
