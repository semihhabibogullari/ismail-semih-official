-- İlk şema. MySQL 8 ve MariaDB uyumlu; JSON kolon tipi kullanılmaz (LONGTEXT).
-- Not: Migration çalıştırıcısı dosyayı ';' karakterine göre ifadelere böler;
-- bu yüzden ifadelerin içinde (metin ya da yorumda) ';' kullanmayın.

CREATE TABLE IF NOT EXISTS site_documents (
  kind VARCHAR(16) NOT NULL,
  data LONGTEXT NOT NULL,
  `version` INT NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_versions (
  id VARCHAR(64) NOT NULL,
  version_number INT NOT NULL,
  note VARCHAR(255) NOT NULL,
  data LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_content_versions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscribers (
  id VARCHAR(64) NOT NULL,
  email VARCHAR(254) NOT NULL,
  consent_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscribers_email (email),
  KEY idx_subscribers_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_admin_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
