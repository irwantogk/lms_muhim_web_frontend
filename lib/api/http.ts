import type { ApiResponse } from "../types.ts";

/**
 * Pembungkus respons yang meniru format backend Elysia:
 *   { success: true, data: ... }
 *
 * Saat integrasi dengan backend asli, ganti fungsi modul di lib/api/*
 * dengan `fetch` ke endpoint Elysia dan buang `data` dari respons JSON ini.
 */
export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function isOk<T>(
  res: ApiResponse<T>,
): res is { success: true; data: T } {
  return res.success;
}
