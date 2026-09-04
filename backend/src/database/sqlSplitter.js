/**
 * Splits a .sql script into individual executable statements.
 *
 * The seed files contain semicolons inside string literals (for example
 * "Stage 3 reached discard point; vaccine efficacy is compromised."), so a naive
 * split on ';' corrupts those statements. This splitter walks the script and only
 * treats a semicolon as a terminator when it is outside a quoted literal and
 * outside a comment.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;          // "'" or '"' or '`' while inside a literal/identifier
  let lineComment = false;   // inside a -- ... comment
  let blockComment = false;  // inside a /* ... */ comment

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
        current += ch;
      }
      continue;
    }

    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (!quote) {
      if (ch === '-' && next === '-') {
        lineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        blockComment = true;
        i++;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        current += ch;
        continue;
      }
      if (ch === ';') {
        const trimmed = current.trim();
        if (trimmed) statements.push(trimmed);
        current = '';
        continue;
      }
      current += ch;
      continue;
    }

    // Inside a quoted literal
    current += ch;
    if (ch === '\\' && quote !== '`') {
      // Backslash escape (MySQL) - consume the escaped character verbatim
      if (next !== undefined) {
        current += next;
        i++;
      }
      continue;
    }
    if (ch === quote) {
      if (next === quote) {
        // Doubled quote is an escaped quote, stay inside the literal
        current += next;
        i++;
      } else {
        quote = null;
      }
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);

  return statements;
}

module.exports = { splitSqlStatements };
