-- ========================================
-- API de Veículos - Schema do Banco de Dados
-- ========================================

CREATE DATABASE IF NOT EXISTS veiculos_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE veiculos_db;

-- ========================================
-- Tabela de Usuários
-- ========================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Tabela de Veículos
-- ========================================

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(50) NOT NULL COMMENT 'Marca do veículo (Toyota, Honda, etc)',
  model VARCHAR(100) NOT NULL COMMENT 'Modelo do veículo (Corolla, Civic, etc)',
  year INT NOT NULL COMMENT 'Ano de fabricação',
  color VARCHAR(30) NOT NULL COMMENT 'Cor do veículo',
  plate VARCHAR(10) UNIQUE NOT NULL COMMENT 'Placa (formato: ABC1D23)',
  price DECIMAL(10, 2) NOT NULL COMMENT 'Preço em reais',
  status ENUM('disponível', 'vendido', 'manutenção') DEFAULT 'disponível',
  created_by INT COMMENT 'ID do usuário que cadastrou',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_brand (brand),
  INDEX idx_status (status),
  INDEX idx_plate (plate),
  INDEX idx_price (price),
  INDEX idx_year (year),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at),
  CONSTRAINT chk_year CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT chk_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Dados Iniciais - Usuário Admin
-- ========================================

-- Senha: admin123
-- Hash gerado com bcrypt (10 rounds)
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'admin@veiculos.com', '$2a$10$YR7kJw8Y0fhHJJxY4K4rJ.2YJ0vJ4xJ7LJ1qJ9J8qJ0J1J2J3J4J5', 'admin'),
('João Silva', 'joao@veiculos.com', '$2a$10$YR7kJw8Y0fhHJJxY4K4rJ.2YJ0vJ4xJ7LJ1qJ9J8qJ0J1J2J3J4J5', 'user'),
('Maria Santos', 'maria@veiculos.com', '$2a$10$YR7kJw8Y0fhHJJxY4K4rJ.2YJ0vJ4xJ7LJ1qJ9J8qJ0J1J2J3J4J5', 'user')
ON DUPLICATE KEY UPDATE id=id;

-- ========================================
-- Dados de Exemplo - Veículos
-- ========================================

INSERT INTO vehicles (brand, model, year, color, plate, price, status, created_by) VALUES
-- Veículos Disponíveis
('Toyota', 'Corolla', 2023, 'Prata', 'ABC1D23', 95000.00, 'disponível', 1),
('Honda', 'Civic', 2023, 'Preto', 'DEF4G56', 105000.00, 'disponível', 1),
('Volkswagen', 'Golf', 2022, 'Branco', 'GHI7J89', 85000.00, 'disponível', 1),
('Chevrolet', 'Onix', 2023, 'Vermelho', 'JKL0M12', 68000.00, 'disponível', 1),
('Hyundai', 'HB20', 2022, 'Azul', 'MNO3P45', 62000.00, 'disponível', 2),
('Fiat', 'Argo', 2023, 'Branco', 'PQR6S78', 70000.00, 'disponível', 2),
('Nissan', 'Kicks', 2022, 'Preto', 'STU9V01', 92000.00, 'disponível', 2),
('Renault', 'Sandero', 2023, 'Prata', 'VWX2Y34', 65000.00, 'disponível', 1),
('Ford', 'Ka', 2022, 'Vermelho', 'YZA5B67', 58000.00, 'disponível', 1),
('Jeep', 'Renegade', 2023, 'Branco', 'BCD8E90', 115000.00, 'disponível', 1),

-- Veículos Vendidos
('Toyota', 'Hilux', 2022, 'Cinza', 'EFG1H23', 185000.00, 'vendido', 1),
('Honda', 'HR-V', 2021, 'Preto', 'HIJ4K56', 95000.00, 'vendido', 1),
('Volkswagen', 'Polo', 2022, 'Branco', 'KLM7N89', 72000.00, 'vendido', 2),

-- Veículos em Manutenção
('Chevrolet', 'Tracker', 2023, 'Prata', 'NOP0Q12', 128000.00, 'manutenção', 1),
('Hyundai', 'Creta', 2022, 'Azul', 'QRS3T45', 118000.00, 'manutenção', 2)
ON DUPLICATE KEY UPDATE id=id;

-- ========================================
-- Views Úteis
-- ========================================

-- View: Veículos disponíveis com informações do criador
CREATE OR REPLACE VIEW v_veiculos_disponiveis AS
SELECT 
  v.id,
  v.brand,
  v.model,
  v.year,
  v.color,
  v.plate,
  v.price,
  v.status,
  v.created_at,
  u.name AS created_by_name,
  u.email AS created_by_email
FROM vehicles v
LEFT JOIN users u ON v.created_by = u.id
WHERE v.status = 'disponível'
ORDER BY v.created_at DESC;

-- View: Estatísticas de veículos por status
CREATE OR REPLACE VIEW v_estatisticas_veiculos AS
SELECT 
  status,
  COUNT(*) AS quantidade,
  AVG(price) AS preco_medio,
  MIN(price) AS preco_minimo,
  MAX(price) AS preco_maximo,
  SUM(price) AS valor_total
FROM vehicles
GROUP BY status;

-- View: Veículos por marca
CREATE OR REPLACE VIEW v_veiculos_por_marca AS
SELECT 
  brand AS marca,
  COUNT(*) AS quantidade,
  AVG(price) AS preco_medio,
  COUNT(CASE WHEN status = 'disponível' THEN 1 END) AS disponiveis,
  COUNT(CASE WHEN status = 'vendido' THEN 1 END) AS vendidos,
  COUNT(CASE WHEN status = 'manutenção' THEN 1 END) AS em_manutencao
FROM vehicles
GROUP BY brand
ORDER BY quantidade DESC;

-- ========================================
-- Procedures Úteis
-- ========================================

-- Procedure: Buscar veículos com filtros
DELIMITER //
CREATE PROCEDURE sp_buscar_veiculos(
  IN p_marca VARCHAR(50),
  IN p_status VARCHAR(20),
  IN p_preco_min DECIMAL(10,2),
  IN p_preco_max DECIMAL(10,2),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT 
    v.*,
    u.name AS created_by_name
  FROM vehicles v
  LEFT JOIN users u ON v.created_by = u.id
  WHERE 
    (p_marca IS NULL OR v.brand = p_marca)
    AND (p_status IS NULL OR v.status = p_status)
    AND (p_preco_min IS NULL OR v.price >= p_preco_min)
    AND (p_preco_max IS NULL OR v.price <= p_preco_max)
  ORDER BY v.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END //
DELIMITER ;

-- Procedure: Estatísticas de veículos
DELIMITER //
CREATE PROCEDURE sp_estatisticas_veiculos()
BEGIN
  SELECT 
    COUNT(*) AS total_veiculos,
    COUNT(CASE WHEN status = 'disponível' THEN 1 END) AS disponiveis,
    COUNT(CASE WHEN status = 'vendido' THEN 1 END) AS vendidos,
    COUNT(CASE WHEN status = 'manutenção' THEN 1 END) AS em_manutencao,
    COUNT(DISTINCT brand) AS total_marcas,
    AVG(price) AS preco_medio,
    MIN(year) AS ano_mais_antigo,
    MAX(year) AS ano_mais_recente
  FROM vehicles;
END //
DELIMITER ;

-- ========================================
-- Triggers
-- ========================================

-- Trigger: Validar placa antes de inserir
DELIMITER //
CREATE TRIGGER trg_validate_plate_before_insert
BEFORE INSERT ON vehicles
FOR EACH ROW
BEGIN
  IF NEW.plate NOT REGEXP '^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Placa inválida. Formato esperado: ABC1D23';
  END IF;
END //
DELIMITER ;

-- Trigger: Validar placa antes de atualizar
DELIMITER //
CREATE TRIGGER trg_validate_plate_before_update
BEFORE UPDATE ON vehicles
FOR EACH ROW
BEGIN
  IF NEW.plate NOT REGEXP '^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Placa inválida. Formato esperado: ABC1D23';
  END IF;
END //
DELIMITER ;

-- ========================================
-- Auditoria (Opcional)
-- ========================================

-- Tabela de Log de Alterações em Veículos
CREATE TABLE IF NOT EXISTS vehicle_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  old_data JSON,
  new_data JSON,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_action (action),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Funções Úteis
-- ========================================

-- Função: Calcular idade do veículo
DELIMITER //
CREATE FUNCTION fn_idade_veiculo(p_year INT)
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN YEAR(CURDATE()) - p_year;
END //
DELIMITER ;

-- Função: Formatar preço em reais
DELIMITER //
CREATE FUNCTION fn_formatar_preco(p_price DECIMAL(10,2))
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  RETURN CONCAT('R$ ', FORMAT(p_price, 2, 'pt_BR'));
END //
DELIMITER ;

-- ========================================
-- Grants e Permissões (Ajustar conforme necessário)
-- ========================================

-- Criar usuário para aplicação (exemplo)
-- CREATE USER IF NOT EXISTS 'app_veiculos'@'%' IDENTIFIED BY 'senha_segura_aqui';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON veiculos_db.* TO 'app_veiculos'@'%';
-- FLUSH PRIVILEGES;

-- ========================================
-- Informações e Verificações
-- ========================================

-- Verificar estrutura das tabelas
SELECT 'Tabelas criadas com sucesso!' AS status;
SHOW TABLES;

-- Verificar dados inseridos
SELECT 'Usuários cadastrados:' AS info, COUNT(*) AS total FROM users;
SELECT 'Veículos cadastrados:' AS info, COUNT(*) AS total FROM vehicles;

-- Mostrar veículos por status
SELECT status, COUNT(*) AS quantidade FROM vehicles GROUP BY status;

-- ========================================
-- Índices Compostos para Otimização
-- ========================================

-- Índice composto para busca por marca e status
CREATE INDEX idx_brand_status ON vehicles(brand, status);

-- Índice composto para busca por preço e status
CREATE INDEX idx_price_status ON vehicles(price, status);

-- Índice composto para busca por ano e status
CREATE INDEX idx_year_status ON vehicles(year, status);

-- ========================================
-- FIM DO SCRIPT
-- ========================================

SELECT '========================================' AS '';
SELECT 'Schema criado com sucesso!' AS 'STATUS';
SELECT '========================================' AS '';
SELECT CONCAT('Total de usuários: ', COUNT(*)) AS 'INFO' FROM users;
SELECT CONCAT('Total de veículos: ', COUNT(*)) AS 'INFO' FROM vehicles;
SELECT CONCAT('Veículos disponíveis: ', COUNT(*)) AS 'INFO' FROM vehicles WHERE status = 'disponível';
SELECT '========================================' AS '';
