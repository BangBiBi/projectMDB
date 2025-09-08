
# 멀티 데이터베이스 관리 시스템 (Multi-Database Management System)

## 프로젝트 개요
- **프로젝트명**: 이질적인 데이터베이스 환경을 극복하는 대용량 데이터베이스 관리 시스템의 설계 및 구현
- **연구 기간**: 15주 (2025년 9월 시작)
- **목적**: 5개 데이터베이스에서 동일한 데이터로 성능 비교 분석
- **개발 환경**: WSL2 Ubuntu, Node.js 20.19.4, Docker

## 시스템 구조 및 주요 기술
```
projectMDB/
├── backend/                 # Node.js + TypeScript 백엔드
│   ├── src/
│   │   ├── index.ts        # Express 서버 메인
│   │   ├── config/
│   │   │   └── database.ts # DatabaseConnections 싱글톤 클래스
│   │   └── routes/
│   │       ├── database.ts # DB 상태 확인 API
│   │       └── schema.ts   # 스키마 관리 API
│   ├── .env               # 데이터베이스 연결 설정
│   └── package.json       # 의존성 관리
├── database/
│   └── schemas/           # 각 DB별 스키마 파일
├── docker-compose.yml     # 5개 DB 컨테이너 오케스트레이션
└── frontend/              # HTML/CSS/JS 대시보드
```

## 데이터베이스 및 테이블
- **MySQL 8.0**: mdb-mysql (포트: 3307)
- **PostgreSQL 15**: mdb-postgresql (포트: 5433)
- **MongoDB 7.0**: mdb-mongodb (포트: 27018)
- **Oracle 21c XE**: mdb-oracle (포트: 1522)
- **SQLite 3**: 파일 기반 (backend/data/postal_codes.db)

### 통일된 4개 테이블 구조
1. **postal_codes** - 메인 우편번호 데이터
2. **performance_metrics** - 성능 측정 데이터
3. **audit_logs** - 변경사항 추적
4. **data_integrity_checks** - 무결성 검사

## 2일차 주요 성과 (2025년 9월 7일)

### ✅ 대용량 데이터 처리 및 대시보드 구현
- 74MB 대용량 파일 처리 (370,038 lines)
- MySQL 10,000개 레코드 삽입 (374.67 records/sec)
- 총 10,222개 레코드 저장 (5개 DB)
- 실시간 모니터링 대시보드 (HTML/CSS/JS)
- 프론트엔드/백엔드 분리 아키텍처

### ✅ API 및 대시보드
- POST /api/postal/upload       # 파일 업로드 및 처리
- GET  /api/postal/stats        # 전체 DB 통계 정보
- GET  /api/postal/{db}/count   # 개별 DB 레코드 수
- POST /api/postal/{db}/insert  # 개별 DB 데이터 삽입

### ✅ 실시간 대시보드 주요 기능
- 각 DB별 레코드 수/상태 실시간 표시
- 전체 통계 박스(총 레코드, 활성 DB, 평균 쿼리속도)
- 반응형 그리드, 그라데이션 디자인, 자동 새로고침

### 📈 성과 지표
- 5개 DB 모두 연결 및 스키마 구성 완료
- 각 DB당 4개 테이블, 총 20개 테이블 생성
- 11개 API 모두 정상 작동
- TypeScript, ESLint 적용
- Git으로 체계적 관리

---

## 다음 단계 로드맵

### 3일차: 성능 벤치마크 및 쿼리 최적화
- 대용량 데이터 전체 삽입 및 성능 측정
- 쿼리 최적화, 인덱스 테스트, 데이터 시각화

### 4~5일차: 고급 기능 및 연구 보고서
- 데이터 무결성 검사, 감사 로그, 백업/복구
- 성능 비교 분석 보고서 작성

---

## 참고 정보

### 주요 명령어
```bash
# Docker 컨테이너 상태 확인
docker ps

# 백엔드 서버 실행
cd backend && npm run dev

# DB 접속 예시
docker exec -it mdb-mysql mysql -u mdb_user -pmdb_password postal_codes_db
docker exec -it mdb-postgresql psql -U mdb_user -d postal_codes_db
docker exec -it mdb-mongodb mongosh "mongodb://admin:adminpassword@localhost:27017/postal_codes_db?authSource=admin"
docker exec -it mdb-oracle sqlplus system/mdb_password@XE
sqlite3 backend/data/postal_codes.db
```

### API 테스트 URL
- 전체 DB 상태: http://localhost:3001/api/postal/stats
- MySQL 상태: http://localhost:3001/api/databases/mysql/health
- PostgreSQL 상태: http://localhost:3001/api/databases/postgresql/health
- MongoDB 상태: http://localhost:3001/api/databases/mongodb/health
- Oracle 상태: http://localhost:3001/api/databases/oracle/health
- SQLite 상태: http://localhost:3001/api/databases/sqlite/health

---
**최종 업데이트**: 2025년 9월 8일

#### 5. **동시성**
- 동시 연결 수
- 락 대기 시간
- 데드락 발생률

## 🧪 테스트 시나리오

### Phase 1: 기본 성능 테스트 (2일차)
- **공공데이터 API**: 한국 우편번호 데이터
- **소규모 테스트**: 각 DB당 5개 레코드
- **한글 인코딩**: UTF-8 처리 검증

### Phase 2: 중간 규모 성능 테스트 (3일차)
- **중간 규모**: 10만 건 데이터 삽입
- **쿼리 패턴**: 단순/복합 조회 성능 비교
- **벤치마크**: 삽입/조회/업데이트 성능 측정

### Phase 3: 대용량 및 고급 기능 테스트 (4-5일차)
- **대용량**: 100만 건 이상
- **집계 쿼리**: GROUP BY, SUM, AVG
- **지리정보 쿼리**: 거리 계산, 영역 검색
- **동시성 테스트**: 다중 사용자 시뮬레이션

### Phase 4: 확장성 테스트  
- **데이터 증가**: 성능 변화 측정
- **동시 사용자**: 1 → 100 → 1000명
- **시간대별**: 24시간 지속 테스트

## 🛠 기술 스택

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS (Apple-style minimal design)
- **State Management**: Redux Toolkit
- **Data Visualization**: Chart.js, D3.js

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **API**: RESTful API + GraphQL
- **Authentication**: JWT

### 데이터베이스
1. **MySQL 8.0** - 전통적인 관계형 DB (OLTP 최적화)
2. **PostgreSQL 15** - 고급 관계형 DB (복잡한 쿼리 최적화)  
3. **MongoDB 7.0** - NoSQL 문서 DB (유연성과 확장성)
4. **Oracle 21c XE** - 엔터프라이즈 관계형 DB (고급 최적화 기능)
5. **SQLite 3** - 경량 파일 기반 DB (개발 편의성과 경량화)

### DevOps & Tools
- **Environment**: WSL2 Ubuntu
- **Container**: Docker & Docker Compose
- **Version Control**: Git & GitHub
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions

## 📁 프로젝트 구조

```
projectMDB/
├── backend/                  # Node.js + TypeScript 백엔드
│   ├── src/
│   │   ├── index.ts         # Express 서버 메인
│   │   ├── config/
│   │   │   └── database.ts  # DatabaseConnections 싱글톤 클래스
│   │   └── routes/
│   │       ├── database.ts  # DB 상태 확인 API
│   │       └── schema.ts    # 스키마 관리 API
│   ├── data/
│   │   └── postal_codes.db  # SQLite 데이터베이스 파일
│   ├── .env                 # 환경변수 (DB 연결 정보)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + TypeScript (준비 단계)
│   └── (향후 개발 예정)
├── database/                 # 데이터베이스 스키마 파일
│   └── schemas/             # 각 DB별 초기화 스크립트
│       ├── mysql/init_schema.sql
│       ├── postgresql/init_schema.sql
│       ├── mongodb/init_schema.js
│       ├── oracle/init_schema.sql
│       └── sqlite/init_schema.sql
├── docker-compose.yml        # 5개 DB 컨테이너 오케스트레이션
├── DEVELOPMENT_LOG.md        # 개발 일지 (NEW)
├── .gitignore
└── README.md
```

## 🚀 현재 구현 상태 (1일차 완료)

### ✅ 완료된 기능
- **Multi-Database Connection**: 5개 DB 모두 연결 및 테스트 완료
- **Unified Schema**: 4개 테이블 구조 모든 DB에 생성 완료
- **REST API**: 11개 엔드포인트 모두 정상 작동
- **Docker Infrastructure**: 모든 컨테이너 안정적 실행
- **Data Integrity & Audit**: 감사 로그 및 무결성 검사 테이블 준비
- **Version Control**: GitHub 레포지토리 설정 및 코드 업로드

### 🌐 API 엔드포인트
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/databases/health` | 전체 DB 상태 확인 |
| GET | `/api/v1/databases/mysql/health` | MySQL 상태 확인 |
| GET | `/api/v1/databases/postgresql/health` | PostgreSQL 상태 확인 |
| GET | `/api/v1/databases/mongodb/health` | MongoDB 상태 확인 |
| GET | `/api/v1/databases/oracle/health` | Oracle 상태 확인 |
| GET | `/api/v1/databases/sqlite/health` | SQLite 상태 확인 |
| GET | `/api/v1/schema/tables` | SQLite 테이블 목록 |

### 🐳 Docker 컨테이너 상태
| 데이터베이스 | 컨테이너명 | 포트 | 상태 |
|-------------|------------|------|------|
| MySQL 8.0 | `mdb-mysql` | 3307 | ✅ Running |
| PostgreSQL 15 | `mdb-postgresql` | 5433 | ✅ Running |
| MongoDB 7.0 | `mdb-mongodb` | 27018 | ✅ Running |
| Oracle 21c XE | `mdb-oracle` | 1522 | ✅ Running |
| SQLite 3 | (File-based) | - | ✅ Ready |

## 🚀 개발 환경 설정 (WSL2 Ubuntu)

### 1. 필수 요구사항
- WSL2 Ubuntu
- Node.js 18.x 이상
- Docker & Docker Compose
- Git

### 2. 프로젝트 클론 및 설정
```bash
git clone <repository-url>
cd projectMDB

# 데이터베이스 컨테이너 시작
docker-compose up -d

# 백엔드 의존성 설치 및 실행
cd backend
npm install
npm run dev

# 프론트엔드 의존성 설치 및 실행
cd ../frontend
npm install
npm start
```

## 📅 개발 로드맵

### Phase 1: 기반 시스템 구축 (1-3주차)
- [x] 프로젝트 요구사항 정의 및 시스템 아키텍처 설계
- [x] 기존 DBMS 조사 및 특허 분석
- [x] 우편번호 기반 데이터 스키마 설계

## 🗓️ 개발 로드맵 (15주 프로젝트)

### ✅ 1일차 완료 (2025.09.06)
- [x] 프로젝트 환경 설정 및 Docker 컨테이너 구성
- [x] 5개 데이터베이스 연결 및 스키마 생성
- [x] REST API 구현 및 테스트
- [x] 감사 로그 및 무결성 검사 테이블 추가
- [x] GitHub 레포지토리 설정

### 🎯 2일차 계획 (2025.09.07) - 공공데이터 API 테스트
- [x] 공공데이터 포털 API 연동 (주소데이터 ZIP 파일)
- [x] 한글 인코딩 처리 및 검증 (UTF-8)
- [x] 5개 데이터베이스별 데이터 삽입 테스트 (각 5개 레코드)
- [x] 데이터 무결성 검증 시스템 테스트

### Phase 1: 기본 성능 테스트 (3-5일차)
- [x] 중간 규모 데이터 삽입 (10만 건)
- [ ] 단순 CRUD 성능 벤치마크
- [ ] 각 DB별 성능 특성 분석
- [ ] performance_metrics 테이블 활용

### Phase 2: 프론트엔드 개발 (4-7일차)
- [ ] React + TypeScript 환경 설정
- [ ] 성능 비교 대시보드 구현
- [ ] 실시간 모니터링 시스템
- [ ] 데이터 시각화 컴포넌트

### Phase 3: 고급 분석 기능 (8-11일차)
- [ ] 복합 쿼리 성능 비교
- [ ] 지리정보 쿼리 최적화
- [ ] 동시성 테스트 구현
- [ ] 자동 성능 리포트 생성

### Phase 4: 최종 통합 및 문서화 (12-15일차)
- [ ] 대용량 데이터 처리 테스트 (100만 건 이상)
- [ ] 전체 시스템 통합 테스트
- [ ] 연구 결과 분석 및 문서화
- [ ] 최종 발표 자료 준비

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/BangBiBi/projectMDB.git
cd projectMDB
```

### 2. Docker 컨테이너 시작
```bash
docker-compose up -d
```

### 3. 백엔드 서버 실행
```bash
cd backend
npm install
npm run dev
```

### 4. API 테스트
브라우저에서 http://localhost:3001/api/v1/databases/health 접속

## 🛠️ 개발 환경 요구사항

- **OS**: WSL2 Ubuntu (또는 Linux/macOS)
- **Node.js**: 20.19.4+
- **Docker**: 최신 버전
- **npm**: 11.5.2+
- **메모리**: 최소 8GB (Oracle 컨테이너 고려)
- **디스크**: 최소 10GB 여유 공간

## 📊 성능 벤치마크 (예상)

| 데이터베이스 | 삽입 성능 | 단순 조회 | 복합 조회 | 저장 효율성 |
|-------------|-----------|-----------|-----------|-------------|
| MySQL | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| PostgreSQL | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| MongoDB | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| Oracle | ★★☆☆☆ | ★★★★★ | ★★★★★ | ★★☆☆☆ |
| SQLite | ★★★★★ | ★★★★★ | ★★☆☆☆ | ★★★★★ |

*실제 성능은 테스트를 통해 검증 예정

## 📞 문의 및 지원

- **개발자**: BangBiBi
- **GitHub Issues**: https://github.com/BangBiBi/projectMDB/issues
- **프로젝트 위키**: https://github.com/BangBiBi/projectMDB/wiki
- **개발 일지**: [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)

## 📝 라이센스

MIT License

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 통해 연락해 주세요.

---

**현재 상태**: Phase 1 - 프로젝트 초기 설정 완료
**다음 단계**: 데이터베이스 아키텍처 설계 및 우편번호 스키마 정의

