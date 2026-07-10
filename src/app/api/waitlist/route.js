import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'waitlist_entries.json');

// Helper to read waitlist entries from local file database
function readEntries() {
  try {
    if (!fs.existsSync(filePath)) {
      // Seed database with mock waitlist entries
      const initial = [
        { id: '1', name: 'Satoshi Nakamoto', email: 'satoshi@bitcoin.org', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
        { id: '2', name: 'Vitalik Buterin', email: 'vitalik@ethereum.org', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
        { id: '3', name: 'Changpeng Zhao', email: 'cz@binance.com', created_at: new Date(Date.now() - 3600000 * 3).toISOString() }
      ];
      fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading waitlist file:', error);
    return [];
  }
}

// Helper to write waitlist entries to local file database
function writeEntries(entries) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error('Error writing waitlist file:', error);
  }
}

export async function GET() {
  const entries = readEntries();
  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req) {
  try {
    const { name, email } = await req.json();
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const entries = readEntries();
    
    // Validate uniqueness
    if (entries.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'This email is already registered on the waitlist.' }, { status: 400 });
    }

    const newEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      created_at: new Date().toISOString()
    };

    entries.push(newEntry);
    writeEntries(entries);

    return NextResponse.json({ success: true, data: newEntry });
  } catch (error) {
    console.error('Waitlist POST error:', error);
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
