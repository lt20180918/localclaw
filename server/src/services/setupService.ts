import { getDb, persistDb } from '../db/database';

/**
 * 本地设置管理 — 使用 SQLite settings 表 (key/value)
 *
 * 存储用户配置: API Key、模型、Channel 等
 * 这些是 Web Panel 本地持久化的设置，独立于 Gateway
 */

/** 获取单个设置 */
export function getSetting(key: string): string | null {
    const db = getDb();
    const result = db.exec('SELECT value FROM settings WHERE key = ?', [key]);
    if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] as string;
    }
    return null;
}

/** 获取多个设置 (批量) */
export function getSettings(keys: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const key of keys) {
        result[key] = getSetting(key);
    }
    return result;
}

/** 获取所有设置 */
export function getAllSettings(): Record<string, string> {
    const db = getDb();
    const result = db.exec('SELECT key, value FROM settings ORDER BY key');
    const settings: Record<string, string> = {};
    if (result.length > 0) {
        for (const row of result[0].values) {
            settings[row[0] as string] = row[1] as string;
        }
    }
    return settings;
}

/** 设置单个值 */
export function setSetting(key: string, value: string): void {
    const db = getDb();
    db.run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
        [key, value, value]
    );
    persistDb();
}

/** 批量设置 */
export function setSettings(entries: Record<string, string>): void {
    const db = getDb();
    for (const [key, value] of Object.entries(entries)) {
        db.run(
            `INSERT INTO settings (key, value, updated_at)
             VALUES (?, ?, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
            [key, value, value]
        );
    }
    persistDb();
}

/** 删除设置 */
export function deleteSetting(key: string): void {
    const db = getDb();
    db.run('DELETE FROM settings WHERE key = ?', [key]);
    persistDb();
}

/** 检查是否已完成初始设置 */
export function isSetupComplete(): boolean {
    const apiKey = getSetting('llm_api_key');
    return !!apiKey && apiKey.length > 0;
}

// ─── 快捷方法 ───

/** 获取 Setup 相关的所有配置 */
export function getSetupConfig() {
    return {
        llm_api_key: maskApiKey(getSetting('llm_api_key')),
        llm_api_key_set: !!getSetting('llm_api_key'),
        llm_model: getSetting('llm_model') || '',
        llm_base_url: getSetting('llm_base_url') || '',
        channel_appid: getSetting('channel_appid') || '',
        channel_secret: maskApiKey(getSetting('channel_secret')),
        channel_secret_set: !!getSetting('channel_secret'),
        setup_complete: isSetupComplete(),
    };
}

/** 掩码 API Key (只显示末尾 4 位) */
function maskApiKey(key: string | null): string {
    if (!key || key.length < 8) return key ? '****' : '';
    return '****' + key.slice(-4);
}
