// ──────────────────────────────────────────────────────────────
//  Odessa Streets — demo client
//  Usage:  node client.js [search term]
//          node client.js Суворовська
//          node client.js Gagarin
// ──────────────────────────────────────────────────────────────
'use strict';

const path             = require('path');
const StreetRepository = require('./StreetRepository');

// ── helpers ───────────────────────────────────────────────────

const hr  = (char = '─', len = 60) => char.repeat(len);
const log = console.log;

function printStreets(streets, label) {
  log(`\n${hr()}`);
  log(`  ${label}  (${streets.length} result${streets.length !== 1 ? 's' : ''})`);
  log(hr());
  if (streets.length === 0) {
    log('  (no results)');
    return;
  }
  for (const s of streets) {
    log(`  #${String(s.id).padStart(3, '0')}  ${s.oldName.padEnd(38)} →  ${s.currentName}`);
    if (s.hasNotes()) log(`         📖  ${s.notes}`);
  }
}

// ── main ──────────────────────────────────────────────────────

const DB_PATH = path.join(__dirname, 'odessa_streets.db');
const repo    = new StreetRepository(DB_PATH);

log(hr('═'));
log('  ODESSA STREETS — repository demo client');
log(hr('═'));
log(`  Database : ${DB_PATH}`);
log(`  Records  : ${repo.count()}`);

// 1. Lookup from CLI argument (or default demo terms)
const searchTerm = process.argv[2];

if (searchTerm) {
  // ── Single search from CLI ──────────────────────────────────
  const results = repo.findByOldOrNewName(searchTerm);
  printStreets(results, `findByOldOrNewName("${searchTerm}")`);

} else {
  // ── Built-in demo queries ───────────────────────────────────

  // a) findById
  const byId = repo.findById(10);
  log(`\n${hr()}`);
  log('  findById(10)');
  log(hr());
  log(byId ? `  ${byId}` : '  not found');

  // b) findByOldOrNewName — matches both columns
  printStreets(
    repo.findByOldOrNewName('Суворовська'),
    'findByOldOrNewName("Суворовська")'
  );

  // c) findByCurrentName
  printStreets(
    repo.findByCurrentName('Героїв'),
    'findByCurrentName("Героїв")'
  );

  // d) findByOldName
  printStreets(
    repo.findByOldName('Гагаріна'),
    'findByOldName("Гагаріна")'
  );

  // e) findWithNotes — only streets with article links
  const withNotes = repo.findWithNotes();
  log(`\n${hr()}`);
  log(`  findWithNotes()  →  ${withNotes.length} streets have reference articles`);
  log(hr());

  // f) toJSON demo
  log('\n  toJSON() on the first result:');
  log(' ', JSON.stringify(withNotes[0].toJSON(), null, 2).replace(/\n/g, '\n  '));
}

repo.close();
log(`\n${hr('═')}\n`);
