const { pool } = require('./database');

class User {
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(userData) {
    const { email, password_hash, name, phone, is_actor } = userData;
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone, is_actor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, password_hash, name, phone, is_actor]
    );
    return result.rows[0];
  }

  static async update(id, updates) {
    const { name, phone, is_actor } = updates;
    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2, is_actor = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, phone, is_actor, id]
    );
    return result.rows[0];
  }

  static async getUserWithTimeslotsAndScenes(id) {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) return null;

    const user = userResult.rows[0];

    const timeslotsResult = await pool.query(
      'SELECT timeslot_id FROM user_timeslots WHERE user_id = $1',
      [id]
    );

    const scenesResult = await pool.query(
      'SELECT scene_id FROM user_scenes WHERE user_id = $1',
      [id]
    );

    return {
      ...user,
      availableTimeslots: timeslotsResult.rows.map(row => row.timeslot_id),
      scenes: scenesResult.rows.map(row => row.scene_id)
    };
  }

  static async updateTimeslots(userId, timeslots) {
    await pool.query('DELETE FROM user_timeslots WHERE user_id = $1', [userId]);
    
    if (timeslots.length > 0) {
      const values = timeslots.map((_, index) => `($1, $${index + 2})`).join(', ');
      const query = `INSERT INTO user_timeslots (user_id, timeslot_id) VALUES ${values}`;
      await pool.query(query, [userId, ...timeslots]);
    }
  }

  static async updateScenes(userId, scenes) {
    await pool.query('DELETE FROM user_scenes WHERE user_id = $1', [userId]);
    
    if (scenes.length > 0) {
      const values = scenes.map((_, index) => `($1, $${index + 2})`).join(', ');
      const query = `INSERT INTO user_scenes (user_id, scene_id) VALUES ${values}`;
      await pool.query(query, [userId, ...scenes]);
    }
  }

  static async getAllActors() {
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.phone,
        ARRAY_AGG(DISTINCT ut.timeslot_id) FILTER (WHERE ut.timeslot_id IS NOT NULL) as available_timeslots,
        ARRAY_AGG(DISTINCT us.scene_id) FILTER (WHERE us.scene_id IS NOT NULL) as scenes
      FROM users u
      LEFT JOIN user_timeslots ut ON u.id = ut.user_id
      LEFT JOIN user_scenes us ON u.id = us.user_id
      WHERE u.is_actor = true
      GROUP BY u.id, u.name, u.email, u.phone
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      availableTimeslots: row.available_timeslots || [],
      scenes: row.scenes || []
    }));
  }
}

module.exports = User;
