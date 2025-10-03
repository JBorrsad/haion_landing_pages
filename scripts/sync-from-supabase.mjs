#!/usr/bin/env node

/**
 * Script de sincronización de contenido desde Supabase
 *
 * Este script se ejecuta en GitHub Actions para:
 * 1. Conectar a Supabase con SERVICE_ROLE
 * 2. Leer toda la tabla `copy`
 * 3. Agrupar por página y locale
 * 4. Generar archivos JSON en content/<locale>/<page>.json
 * 5. Opcionalmente descargar imágenes a public/cms/
 *
 * Variables de entorno requeridas:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE
 *
 * Variables opcionales:
 * - DOWNLOAD_ASSETS=true (para descargar imágenes localmente)
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const DOWNLOAD_ASSETS = process.env.DOWNLOAD_ASSETS === "true";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE");
  process.exit(1);
}

console.log("🔄 Starting content sync from Supabase...");
console.log("");

// Crear cliente de Supabase con SERVICE_ROLE (solo en Actions)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

try {
  // Leer todos los registros de copy
  const { data: copyRecords, error } = await supabase
    .from("copy")
    .select("*")
    .order("page, key");

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!copyRecords || copyRecords.length === 0) {
    console.warn("⚠️  No content found in database");
    process.exit(0);
  }

  console.log(`📦 Found ${copyRecords.length} content records`);
  console.log("");

  // Agrupar por locale y page
  const groupedContent = {};

  for (const record of copyRecords) {
    const { locale, page, key, value, type } = record;

    if (!groupedContent[locale]) {
      groupedContent[locale] = {};
    }

    if (!groupedContent[locale][page]) {
      groupedContent[locale][page] = {};
    }

    // Convertir key de flat a nested (ej: "hero.title" → {hero: {title: "..."}})
    const keys = key.split(".");
    let current = groupedContent[locale][page];

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k]) {
        current[k] = {};
      }
      current = current[k];
    }

    const lastKey = keys[keys.length - 1];

    // Si es imagen y DOWNLOAD_ASSETS, descargar
    if (type === "image" && DOWNLOAD_ASSETS && value.startsWith("http")) {
      // TODO: Implementar descarga de imágenes
      // Por ahora, solo guardar la URL
      current[lastKey] = value;
    } else {
      current[lastKey] = value;
    }
  }

  // Escribir archivos JSON
  const rootDir = path.join(__dirname, "..");

  for (const locale in groupedContent) {
    const contentDir = path.join(rootDir, "content", locale);

    // Crear directorio si no existe
    await fs.mkdir(contentDir, { recursive: true });

    for (const page in groupedContent[locale]) {
      const filePath = path.join(contentDir, `${page}.json`);
      const content = JSON.stringify(groupedContent[locale][page], null, "\t");

      await fs.writeFile(filePath, content, "utf-8");

      console.log(`✅ Written: content/${locale}/${page}.json`);
    }
  }

  console.log("");
  console.log("✨ Content sync completed successfully!");
} catch (err) {
  console.error("");
  console.error("❌ Error syncing content:");
  console.error(err);
  process.exit(1);
}
