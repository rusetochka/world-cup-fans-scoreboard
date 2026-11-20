const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,pub=path.join(root,'public'),data=JSON.parse(fs.readFileSync(path.join(pub,'demo-data.json'),'utf8'));
const matchIds = new Set(data.matches.map(match => match.id));
const playerNames = new Set(data.players.map(player => player.name));
assert.ok(data.bets.length > 0);
assert.ok(data.bets.every(bet => matchIds.has(bet.match_id) && playerNames.has(bet.player)));
for(const filename of fs.readdirSync(pub)){
 const body=fs.readFileSync(path.join(pub,filename),'utf8');
 assert.ok(!/docs\.google\.com|script\.google\.com|spreadsheets\/d\/|sheetId|gviz\/tq/i.test(body),`Spreadsheet reference found in ${filename}`);
 assert.ok(!/https?:\/\/[^\s"']*(?:sheet|docs\.google)/i.test(body),`Spreadsheet URL found in ${filename}`);
}
console.log('Verified demo predictions and checked for spreadsheet references.');
