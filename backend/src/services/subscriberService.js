const db = require('../config/db');
const { uuid } = require('../utils/idGenerator');

class SubscriberService {
  /**
   * Subscribe an email address (idempotent — won't duplicate)
   */
  async subscribe(email) {
    if (!email || !email.includes('@')) {
      throw { status: 400, message: 'A valid email address is required.' };
    }
    const normalized = email.toLowerCase().trim();

    // Create table if it doesn't exist (safe, idempotent)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id           VARCHAR(40) PRIMARY KEY,
        email        VARCHAR(255) NOT NULL UNIQUE,
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at DATETIME NULL
      )
    `).catch(() => {});

    const existing = await db.getOne(
      'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
      [normalized]
    );

    if (existing) {
      if (existing.status === 'active') {
        return { alreadySubscribed: true, message: 'This email is already subscribed.' };
      }
      // Re-subscribe
      await db.execute(
        "UPDATE newsletter_subscribers SET status = 'active', unsubscribed_at = NULL, subscribed_at = CURRENT_TIMESTAMP WHERE email = ?",
        [normalized]
      );
      return { resubscribed: true, message: 'Successfully re-subscribed!' };
    }

    const id = uuid();
    await db.execute(
      "INSERT INTO newsletter_subscribers (id, email, status, subscribed_at) VALUES (?, ?, 'active', CURRENT_TIMESTAMP)",
      [id, normalized]
    );

    return { id, email: normalized, status: 'active', message: 'Successfully subscribed!' };
  }

  /**
   * List all subscribers (admin only)
   */
  async getSubscribers({ status, limit = 100, offset = 0 }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id           VARCHAR(40) PRIMARY KEY,
        email        VARCHAR(255) NOT NULL UNIQUE,
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at DATETIME NULL
      )
    `).catch(() => {});

    let where = '';
    const params = [];
    if (status) {
      where = 'WHERE status = ?';
      params.push(status);
    }

    const countRow = await db.getOne(
      `SELECT COUNT(*) AS total FROM newsletter_subscribers ${where}`,
      params
    );

    const rows = await db.query(
      `SELECT * FROM newsletter_subscribers ${where} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return { subscribers: rows, total: countRow ? countRow.total : 0 };
  }

  /**
   * Unsubscribe an email (admin action)
   */
  async unsubscribe(id) {
    await db.execute(
      "UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    return { success: true };
  }

  /**
   * Delete a subscriber permanently
   */
  async deleteSubscriber(id) {
    await db.execute('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
    return { success: true };
  }
}

module.exports = new SubscriberService();
