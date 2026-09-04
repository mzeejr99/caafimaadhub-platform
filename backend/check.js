const sqlite = require('better-sqlite3'); const sdb = new sqlite('./data/caafimaadhub.sqlite'); console.log(sdb.prepare('SELECT sql FROM sqlite_master WHERE type=\
table\').all());
