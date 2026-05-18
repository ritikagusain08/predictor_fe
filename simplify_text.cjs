const fs = require('fs');
const path = require('path');
const dir = 'src/pages';
const replacements = [
  { search: /Telemetry Sync\.\.\./g, replace: 'Loading...' },
  { search: /Session Telemetry/g, replace: 'Match Results' },
  { search: /Session Data/g, replace: 'Progress' },
  { search: /Telemetry data is unavailable for this race\./g, replace: 'No match data is available.' },
  { search: /Return to Paddock/g, replace: 'Back to Dashboard' },
  { search: /Current session task/g, replace: 'Question' },
  { search: /Nitro Active • 2x Points/g, replace: 'Booster Active • 2x Points' },
  { search: /Prime 2x Multiplier/g, replace: '2x Points Multiplier' },
  { search: /Pilots/g, replace: 'Players' },
  { search: /Pilot/g, replace: 'Player' },
  { search: /Global Hall of Fame/g, replace: 'Global Leaderboard' },
  { search: /Competing against every pilot on the global grid/g, replace: 'Compete against all other players' },
  { search: /Active Pilots/g, replace: 'Active Players' },
  { search: /Pilot Roster/g, replace: 'Player List' },
  { search: /Paddock initialized and online/g, replace: 'Dashboard Ready' },
  { search: /Join Paddock/g, replace: 'Join League' },
  { search: /World Standings/g, replace: 'Leaderboard' }
];

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    replacements.forEach(r => {
      content = content.replace(r.search, r.replace);
    });
    fs.writeFileSync(p, content);
  }
});
console.log('Done standardizing text.');
