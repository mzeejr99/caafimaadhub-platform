const db = require('../config/db');
const { uuid } = require('./idGenerator');

/**
 * Resolves regionId and districtId safely from IDs, names, or fallbacks.
 * Ensures district_id is NEVER null for MySQL/SQLite operations.
 */
async function resolveLocation(options = {}) {
  const regionInput = options.regionId || options.region_id || options.regionName || options.region_name || null;
  const districtInput = options.districtId || options.district_id || options.districtName || options.district_name || options.location_name || options.locationName || null;

  let resolvedRegionId = null;
  let resolvedDistrictId = null;

  // 1. Resolve Region
  if (regionInput) {
    const cleanReg = String(regionInput).trim();
    let reg = await db.getOne(
      `SELECT id FROM regions WHERE id = ? OR LOWER(TRIM(name)) = LOWER(TRIM(?)) OR LOWER(TRIM(code)) = LOWER(TRIM(?))`,
      [cleanReg, cleanReg, cleanReg]
    );

    if (!reg) {
      // Auto-create region if not found
      const newRegId = 'reg-' + cleanReg.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
      const regCode = 'SOM-' + cleanReg.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      try {
        await db.execute(
          `INSERT INTO regions (id, name, code, country, latitude, longitude) VALUES (?, ?, ?, 'Somalia', 2.0469, 45.3182)`,
          [newRegId, cleanReg, regCode || 'SOM']
        );
        reg = await db.getOne(`SELECT id FROM regions WHERE id = ?`, [newRegId]);
      } catch (err) {
        reg = await db.getOne(`SELECT id FROM regions WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`, [cleanReg]);
      }
    }

    if (reg) resolvedRegionId = reg.id;
  }

  // Fallback to default region if not resolved
  if (!resolvedRegionId) {
    const defaultReg = await db.getOne(`SELECT id FROM regions WHERE id = 'reg-banadir' OR LOWER(name) = 'banadir' LIMIT 1`);
    if (defaultReg) {
      resolvedRegionId = defaultReg.id;
    } else {
      const anyReg = await db.getOne(`SELECT id FROM regions LIMIT 1`);
      resolvedRegionId = anyReg ? anyReg.id : 'reg-banadir';
    }
  }

  // 2. Resolve District
  if (districtInput) {
    const cleanDist = String(districtInput).trim();

    // Check if directly matched by ID
    let dist = await db.getOne(`SELECT id, region_id FROM districts WHERE id = ?`, [cleanDist]);

    // Check if matched by Name in resolved region
    if (!dist) {
      dist = await db.getOne(
        `SELECT id, region_id FROM districts WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND region_id = ?`,
        [cleanDist, resolvedRegionId]
      );
    }

    // Check if matched by Name across ANY region
    if (!dist) {
      dist = await db.getOne(
        `SELECT id, region_id FROM districts WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`,
        [cleanDist]
      );
    }

    if (dist) {
      resolvedDistrictId = dist.id;
      // If region wasn't explicitly set, match district's region
      if (!regionInput && dist.region_id) {
        resolvedRegionId = dist.region_id;
      }
    } else {
      // Dynamically create district in this region
      const slug = cleanDist.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
      const newDistId = 'dist-' + (slug || 'custom') + '-' + uuid().slice(0, 6);
      const distCode = (cleanDist.slice(0, 3) + '-' + Math.floor(100 + Math.random() * 900)).toUpperCase();

      try {
        await db.execute(
          `INSERT INTO districts (id, region_id, name, code, latitude, longitude) VALUES (?, ?, ?, ?, 2.0469, 45.3182)`,
          [newDistId, resolvedRegionId, cleanDist, distCode]
        );
        resolvedDistrictId = newDistId;
      } catch (err) {
        // In case of conflict, fetch existing
        const fallback = await db.getOne(`SELECT id FROM districts WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`, [cleanDist]);
        resolvedDistrictId = fallback ? fallback.id : null;
      }
    }
  }

  // If still no district, find first district in this region
  if (!resolvedDistrictId) {
    const regDist = await db.getOne(`SELECT id FROM districts WHERE region_id = ? LIMIT 1`, [resolvedRegionId]);
    if (regDist) {
      resolvedDistrictId = regDist.id;
    } else {
      // Pick ANY district in database
      const anyDist = await db.getOne(`SELECT id, region_id FROM districts LIMIT 1`);
      if (anyDist) {
        resolvedDistrictId = anyDist.id;
        resolvedRegionId = resolvedRegionId || anyDist.region_id;
      } else {
        // Emergency create default district
        const defId = 'dist-banadir-general';
        try {
          await db.execute(
            `INSERT INTO districts (id, region_id, name, code, latitude, longitude) VALUES (?, ?, 'Central District', 'GEN-01', 2.0469, 45.3182)`,
            [defId, resolvedRegionId]
          );
          resolvedDistrictId = defId;
        } catch (e) {
          resolvedDistrictId = defId;
        }
      }
    }
  }

  return {
    regionId: resolvedRegionId,
    districtId: resolvedDistrictId
  };
}

module.exports = { resolveLocation };
