import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

// Initialize Supabase with service role key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws,
  },
});

async function uploadVideo() {
  const bucketName = 'assets';
  const filePath = '/run/media/namasth/Coeur du site/Antigravity/Namasthé/site/public/hero-bg.mp4';
  
  if (!fs.existsSync(filePath)) {
    console.error("Video file not found at", filePath);
    return;
  }

  // 1. Create bucket if it doesn't exist
  console.log("Checking bucket 'assets'...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
    return;
  }
  
  const bucketExists = buckets.some(b => b.name === bucketName);
  if (!bucketExists) {
    console.log("Creating bucket 'assets'...");
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true, // Make sure it's public
      fileSizeLimit: 500000000, // 500MB
    });
    if (createError) {
      console.error("Error creating bucket:", createError);
      return;
    }
  }

  // 2. Upload file
  console.log("Reading video file (215MB)...");
  const fileBuffer = fs.readFileSync(filePath);
  
  console.log("Uploading to Supabase Storage (this might take a minute)...");
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload('hero-bg.mp4', fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (error) {
    console.error("Upload failed:", error);
    return;
  }

  console.log("Upload successful!", data);

  // 3. Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl('hero-bg.mp4');
    
  console.log("Public URL:", publicUrlData.publicUrl);
}

uploadVideo();
