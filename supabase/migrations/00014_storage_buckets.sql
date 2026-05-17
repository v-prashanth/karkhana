-- Create public 'logos' bucket for organization branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

-- Allow authenticated users to upload (or we use Admin API to bypass RLS)
CREATE POLICY "Authenticated users can upload logos" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');
