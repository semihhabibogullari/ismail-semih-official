-- Panelden yüklenen medya (nesneler Cloudflare R2'de, burada yalnızca kayıtları tutulur).
CREATE TABLE IF NOT EXISTS media (
  id VARCHAR(36) NOT NULL,
  object_key VARCHAR(255) NOT NULL,
  url VARCHAR(512) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INT NULL,
  height INT NULL,
  kind VARCHAR(8) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_object_key (object_key),
  KEY idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
