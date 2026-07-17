const fs = require('fs');
const path = require('path');

const localDbPath = path.join(__dirname, '../local_db.json');
let db = { trades: [], wallets: {}, competitions: [], competition_participants: [] };

if (fs.existsSync(localDbPath)) {
  db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
}

if (!db.competitions) db.competitions = [];
if (!db.competition_participants) db.competition_participants = [];

const mockCompId = 'comp-mock-123456';
const hasComp = db.competitions.some(c => c.id === mockCompId);

if (!hasComp) {
  db.competitions.push({
    id: mockCompId,
    title: 'Summer Crypto Sprint',
    description: 'Earn the highest return on Bitcoin and Ethereum trades this summer.',
    entry_fee: 50.00,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    target_profit_percent: 15.00,
    status: 'active',
    created_at: new Date().toISOString()
  });
  console.log('Inserted mock competition to local_db.json');
}

fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Local DB verified and updated successfully.');
