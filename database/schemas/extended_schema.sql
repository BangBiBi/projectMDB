-- 확장된 다중 데이터베이스 스키마 설계
-- 데이터 무결성 검사 및 변경사항 추적을 위한 추가 테이블들

-- 1. 기존 postal_codes 테이블 (메인 데이터)
-- 2. 기존 performance_metrics 테이블 (성능 측정)

-- 3. 데이터 무결성 검사 테이블
CREATE TABLE data_integrity_checks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    check_type VARCHAR(50) NOT NULL, -- 'CONSISTENCY', 'DUPLICATE', 'MISSING', 'FORMAT'
    source_db VARCHAR(20) NOT NULL,  -- 'mysql', 'postgresql', 'mongodb', 'oracle', 'sqlite'
    target_db VARCHAR(20),           -- 비교 대상 DB (NULL이면 단일 DB 체크)
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),          -- 문제가 된 레코드 ID
    check_query TEXT,                -- 실행된 검사 쿼리
    issue_found BOOLEAN DEFAULT FALSE,
    issue_description TEXT,
    data_before JSON,                -- 문제 발생 전 데이터
    data_after JSON,                 -- 문제 발생 후 데이터
    severity_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'RESOLVED', 'IGNORED') DEFAULT 'PENDING',
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    created_by VARCHAR(100),
    notes TEXT
);

-- 4. 변경사항 추적 테이블 (Audit Log)
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    db_type VARCHAR(20) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,                 -- 변경 전 값들
    new_values JSON,                 -- 변경 후 값들
    changed_fields TEXT,             -- 변경된 필드 목록
    change_source VARCHAR(50),       -- 'API', 'SYNC', 'MANUAL', 'MIGRATION'
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    transaction_id VARCHAR(100),
    batch_id VARCHAR(100),           -- 일괄 처리 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_db_table (db_type, table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_operation (operation_type),
    INDEX idx_audit_created_at (created_at)
);

-- 5. 데이터베이스 동기화 상태 테이블
CREATE TABLE sync_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sync_job_id VARCHAR(100) NOT NULL UNIQUE,
    source_db VARCHAR(20) NOT NULL,
    target_db VARCHAR(20) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    sync_type ENUM('FULL', 'INCREMENTAL', 'REAL_TIME') NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL,
    records_total INT DEFAULT 0,
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    sync_direction ENUM('ONE_WAY', 'TWO_WAY') DEFAULT 'ONE_WAY',
    conflict_resolution ENUM('SOURCE_WINS', 'TARGET_WINS', 'NEWEST_WINS', 'MANUAL') DEFAULT 'SOURCE_WINS',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    next_sync_at TIMESTAMP NULL,
    error_message TEXT,
    sync_config JSON,               -- 동기화 설정 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. 데이터 충돌 해결 테이블
CREATE TABLE conflict_resolutions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sync_job_id VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    source_db VARCHAR(20) NOT NULL,
    target_db VARCHAR(20) NOT NULL,
    conflict_type ENUM('UPDATE_CONFLICT', 'DELETE_CONFLICT', 'CONSTRAINT_VIOLATION') NOT NULL,
    source_data JSON,               -- 원본 DB 데이터
    target_data JSON,               -- 대상 DB 데이터
    resolution_strategy VARCHAR(50), -- 해결 방법
    resolved_data JSON,             -- 최종 해결된 데이터
    resolved_by VARCHAR(100),       -- 해결한 사용자/시스템
    resolution_status ENUM('PENDING', 'AUTO_RESOLVED', 'MANUAL_RESOLVED', 'IGNORED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    notes TEXT
);

-- 7. 데이터 품질 메트릭스 테이블
CREATE TABLE data_quality_metrics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    db_type VARCHAR(20) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'COMPLETENESS', 'ACCURACY', 'CONSISTENCY', 'VALIDITY'
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 4),
    threshold_value DECIMAL(10, 4),
    passed BOOLEAN DEFAULT TRUE,
    total_records INT,
    valid_records INT,
    invalid_records INT,
    null_records INT,
    duplicate_records INT,
    check_query TEXT,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quality_db_table (db_type, table_name),
    INDEX idx_quality_metric (metric_type, metric_name),
    INDEX idx_quality_measured_at (measured_at)
);

-- 8. 시스템 헬스 체크 테이블  
CREATE TABLE system_health (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    db_type VARCHAR(20) NOT NULL,
    health_check_type VARCHAR(50) NOT NULL, -- 'CONNECTION', 'PERFORMANCE', 'DISK_SPACE', 'MEMORY'
    status ENUM('HEALTHY', 'WARNING', 'CRITICAL', 'DOWN') NOT NULL,
    metric_value DECIMAL(15, 4),
    threshold_warning DECIMAL(15, 4),
    threshold_critical DECIMAL(15, 4),
    message TEXT,
    response_time_ms INT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alert_sent BOOLEAN DEFAULT FALSE,
    INDEX idx_health_db_type (db_type),
    INDEX idx_health_status (status),
    INDEX idx_health_checked_at (checked_at)
);

-- 인덱스 추가
CREATE INDEX idx_integrity_checks_db ON data_integrity_checks (source_db, target_db);
CREATE INDEX idx_integrity_checks_type ON data_integrity_checks (check_type, status);
CREATE INDEX idx_integrity_checks_created_at ON data_integrity_checks (checked_at);

CREATE INDEX idx_sync_status_dbs ON sync_status (source_db, target_db);
CREATE INDEX idx_sync_status_job ON sync_status (sync_job_id);
CREATE INDEX idx_sync_status_created_at ON sync_status (created_at);

CREATE INDEX idx_conflicts_sync_job ON conflict_resolutions (sync_job_id);
CREATE INDEX idx_conflicts_resolution ON conflict_resolutions (resolution_status);
