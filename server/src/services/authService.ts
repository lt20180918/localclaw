import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDb, persistDb } from '../db/database';
import type { JwtPayload, LoginResponse } from '../types';

const SALT_ROUNDS = 10;

/**
 * 初始化管理员密码
 * 首次启动时将明文密码加密后存入数据库
 */
export function initAdminPassword(): void {
    const db = getDb();
    const result = db.exec('SELECT id FROM auth WHERE id = 1');

    if (result.length === 0 || result[0].values.length === 0) {
        const hash = bcrypt.hashSync(config.adminPassword, SALT_ROUNDS);
        db.run('INSERT INTO auth (id, password_hash) VALUES (1, ?)', [hash]);
        persistDb();
        console.log('[Auth] Admin password initialized');
    }
}

/**
 * 验证密码并返回 JWT Token
 */
export function login(password: string): LoginResponse | null {
    const db = getDb();
    const result = db.exec('SELECT password_hash FROM auth WHERE id = 1');

    if (result.length === 0 || result[0].values.length === 0) {
        return null;
    }

    const hash = result[0].values[0][0] as string;

    if (!bcrypt.compareSync(password, hash)) {
        return null;
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { role: 'admin' };
    const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });

    return {
        token,
        expiresIn: config.jwtExpiresIn,
    };
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
        return null;
    }
}

/**
 * 修改管理员密码
 */
export function changePassword(oldPassword: string, newPassword: string): boolean {
    const db = getDb();
    const result = db.exec('SELECT password_hash FROM auth WHERE id = 1');

    if (result.length === 0 || result[0].values.length === 0) {
        return false;
    }

    const currentHash = result[0].values[0][0] as string;

    if (!bcrypt.compareSync(oldPassword, currentHash)) {
        return false;
    }

    const newHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
    db.run("UPDATE auth SET password_hash = ?, updated_at = datetime('now') WHERE id = 1", [newHash]);
    persistDb();
    return true;
}
