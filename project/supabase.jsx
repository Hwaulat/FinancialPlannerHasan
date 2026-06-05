// supabase.jsx — Supabase client + semua DB helper functions

const _db = window.supabase.createClient(
  'https://ofjqehqcbreaomqpuawx.supabase.co',
  'sb_publishable_FIdeF6TkE8SZ9RZTbGsoYA_Uy8VTGz-'
);

const DB = {
  // ── Transactions ───────────────────────────────────────────
  async getTx() {
    const { data, error } = await _db.from('transactions').select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async addTx(tx) {
    const { data, error } = await _db.from('transactions').insert(tx).select().single();
    if (error) throw error;
    return data;
  },
  async updateTx(id, tx) {
    const { data, error } = await _db.from('transactions').update(tx).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteTx(id) {
    const { error } = await _db.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Budgets (per bulan) ────────────────────────────────────
  async getBudgets(month) {
    const { data, error } = await _db.from('budgets').select('*').eq('month', month);
    if (error) throw error;
    return data || [];
  },
  async setBudget(cat, month, amount, paid = 0) {
    try {
      const res = await _db.from('budgets')
        .upsert({ cat, month, amount, paid }, { onConflict: 'cat,month' })
        .select();
      if (res.error) throw res.error;
      // supabase may return an array for upsert; normalize to single object
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      return data;
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.includes("Could not find the 'paid' column") || msg.includes('column "paid" does not exist')) {
        throw new Error("Database schema missing 'paid' column on 'budgets'. Run the migration: open project/schema.sql and apply it to your Supabase DB (or run ./run_schema.ps1 with SUPABASE_DB_URL).");
      }
      throw err;
    }
  },
  async updateBudgetPaid(id, paid) {
    try {
      const { data, error } = await _db.from('budgets').update({ paid }).eq('id', id).select();
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.includes("Could not find the 'paid' column") || msg.includes('column "paid" does not exist')) {
        throw new Error("Database schema missing 'paid' column on 'budgets'. Run the migration: open project/schema.sql and apply it to your Supabase DB (or run ./run_schema.ps1 with SUPABASE_DB_URL).");
      }
      throw err;
    }
  },
  async deleteBudget(id) {
    const { error } = await _db.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Bills (per bulan) ──────────────────────────────────────
  async getBills(month) {
    const { data, error } = await _db.from('bills').select('*').eq('month', month).order('due_day');
    if (error) throw error;
    return data || [];
  },
  async addBill(bill) {
    const { data, error } = await _db.from('bills').insert(bill).select().single();
    if (error) throw error;
    return data;
  },
  async toggleBill(id, status) {
    const { error } = await _db.from('bills').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async deleteBill(id) {
    const { error } = await _db.from('bills').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Debts ──────────────────────────────────────────────────
  async getDebts() {
    const { data, error } = await _db.from('debts').select('*').order('created_at');
    if (error) throw error;
    return data || [];
  },
  async addDebt(debt) {
    const { data, error } = await _db.from('debts').insert(debt).select().single();
    if (error) throw error;
    return data;
  },
  async updateDebt(id, paid) {
    const { error } = await _db.from('debts').update({ paid }).eq('id', id);
    if (error) throw error;
  },
  async deleteDebt(id) {
    const { error } = await _db.from('debts').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Goals ──────────────────────────────────────────────────
  async getGoals() {
    const { data, error } = await _db.from('goals').select('*').order('created_at');
    if (error) throw error;
    return data || [];
  },
  async addGoal(goal) {
    const { data, error } = await _db.from('goals').insert(goal).select().single();
    if (error) throw error;
    return data;
  },
  async updateGoal(id, progress) {
    const { error } = await _db.from('goals').update({ progress }).eq('id', id);
    if (error) throw error;
  },
  async deleteGoal(id) {
    const { error } = await _db.from('goals').delete().eq('id', id);
    if (error) throw error;
  },
};

window.DB = DB;
