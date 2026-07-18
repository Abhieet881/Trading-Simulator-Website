import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

async function verifyAdmin(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  let isAdmin = dbUser?.is_admin || false;
  if (!dbUser && (user.email === 'patilabhijeet409@gmail.com' || user.email === 'abhieet881@gmail.com')) {
    isAdmin = true;
  }

  if (!isAdmin) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user };
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdmin(supabase);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileType = file.type;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Only JPEG, PNG and WEBP images are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    let publicUrl = '';
    let uploadSuccess = false;

    // Try Supabase Storage
    try {
      // 1. Ensure bucket exists
      try {
        await supabase.storage.createBucket('competition-banners', {
          public: true,
          fileSizeLimit: 5242880,
        });
      } catch (bucketErr) {
        // Ignore if bucket already exists
      }

      // 2. Upload file
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('competition-banners')
        .upload(fileName, fileBuffer, {
          contentType: fileType,
          duplex: 'half'
        });

      if (uploadErr) throw uploadErr;

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('competition-banners')
        .getPublicUrl(fileName);

      publicUrl = urlData?.publicUrl || '';
      uploadSuccess = true;
    } catch (supabaseStorageErr) {
      console.warn('Supabase storage upload failed, uploading to local public folder fallback:', supabaseStorageErr.message);
    }

    // Fallback: Upload to local public/uploads directory
    if (!uploadSuccess) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, fileBuffer);
      publicUrl = `/uploads/${fileName}`;
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('File upload failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
