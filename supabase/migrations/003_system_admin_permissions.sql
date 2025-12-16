-- Migration to allow system_admin to delete items

-- Create helper for system admin check if it doesn't exist
CREATE OR REPLACE FUNCTION is_system_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role = 'system_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy to allow system_admin to delete items
DROP POLICY IF EXISTS "System Admin can delete items" ON request_items;
CREATE POLICY "System Admin can delete items"
    ON request_items FOR DELETE
    TO authenticated
    USING (is_system_admin(auth.uid()));
