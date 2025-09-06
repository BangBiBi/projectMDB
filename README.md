# 이질적인 데이터베이스 환경 성능 비교 분석 시스템 (Multi-Database Performance Comparison System)

## 📋 프로젝트 개요

본 프로젝트는 **동일한 우편번호 데이터를 5개의 서로 다른 데이터베이스에 저장하여 각 데이터베이스의 성능 특성을 비교 분석**하는 시스템입니다. 각 데이터베이스의 장단점을 실제 데이터와 다양한 워크로드를 통해 객관적으로 측정하고 분석합니다.

## 🎯 프로젝트 목적

### 성능 비교 대상
- **삽입 속도**: 대용량 데이터 입력 성능
- **조회 속도**: 단순/복합 쿼리 성능  
- **업데이트 성능**: 데이터 수정 속도
- **저장 효율성**: 디스크 사용량 및 압축률
- **동시성**: 멀티 유저 환경 성능
- **확장성**: 데이터 증가에 따른 성능 변화
- **메모리 사용량**: 캐싱 및 메모리 효율성

## 🛠 선정된 5개 데이터베이스

### 1. **MySQL 8.0** - 전통적인 관계형 DB
- **특징**: OLTP 최적화, B-tree 인덱스, 트랜잭션 처리
- **기대 장점**: 단순 쿼리 빠른 처리, 안정성
- **테스트 초점**: 트랜잭션 처리, 단순 CRUD 성능

### 2. **PostgreSQL 15** - 고급 관계형 DB  
- **특징**: 복잡한 쿼리 최적화, 다양한 인덱스 타입, JSON 지원
- **기대 장점**: 복잡한 분석 쿼리, 지리정보 처리
- **테스트 초점**: 복합 쿼리, 전문 검색, 지리정보 쿼리

### 3. **MongoDB 7.0** - NoSQL 문서 DB
- **특징**: 스키마리스, 수평 확장성, JSON 기반
- **기대 장점**: 유연한 스키마, 빠른 삽입, 수평 확장
- **테스트 초점**: 대량 삽입, 스키마 변경, 집계 파이프라인

### 4. **Oracle 21c XE** - 엔터프라이즈 관계형 DB
- **특징**: 고급 최적화 기능, CBO, 파티셔닝, 엔터프라이즈급 기능
- **기대 장점**: 복잡한 최적화, 대용량 처리, 고급 인덱싱
- **테스트 초점**: 고급 쿼리 최적화, 파티셔닝, 엔터프라이즈 기능

### 5. **SQLite 3** - 경량 파일 기반 DB
- **특징**: 파일 기반, 경량화, 개발 편의성, 임베디드 최적화
- **기대 장점**: 설정 단순함, 빠른 개발, 작은 리소스 사용
- **테스트 초점**: 경량화 성능, 개발 편의성, 단일 사용자 최적화

## 📊 성능 측정 지표

### 1. **처리 성능 (Throughput)**
- 초당 삽입 레코드 수 (IPS)
- 초당 조회 쿼리 수 (QPS)  
- 초당 업데이트 수 (UPS)

### 2. **응답 시간 (Latency)**
- 평균 응답 시간
- 95th Percentile 응답 시간
- 최대 응답 시간

### 3. **리소스 사용량**
- CPU 사용률
- 메모리 사용량
- 디스크 I/O
- 네트워크 I/O

### 4. **저장 효율성**
- 실제 저장 크기
- 압축률
- 인덱스 크기

### 5. **동시성**
- 동시 연결 수
- 락 대기 시간
- 데드락 발생률

## 🧪 테스트 시나리오

### Phase 1: 기본 성능 테스트
- **소규모 데이터**: 10만 건
- **중간 규모**: 100만 건  
- **대용량**: 1,000만 건

### Phase 2: 쿼리 패턴별 성능 테스트
- **단순 조회**: Primary Key 기반
- **범위 조회**: 날짜/지역 범위
- **복합 조회**: 다중 조건
- **집계 쿼리**: GROUP BY, SUM, AVG
- **전문 검색**: 텍스트 검색
- **지리정보 쿼리**: 거리 계산, 영역 검색

### Phase 3: 동시성 테스트
- **읽기 중심**: 90% SELECT
- **쓰기 중심**: 70% INSERT/UPDATE
- **혼합 워크로드**: 60% SELECT, 40% INSERT/UPDATE

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
├── frontend/                 # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 서비스
│   │   ├── store/           # Redux 스토어
│   │   └── styles/          # 스타일 파일
│   ├── public/
│   └── package.json
├── backend/                  # 백엔드 애플리케이션
│   ├── src/
│   │   ├── controllers/     # API 컨트롤러
│   │   ├── models/          # 데이터 모델
│   │   ├── services/        # 비즈니스 로직
│   │   ├── middleware/      # 미들웨어
│   │   ├── routes/          # 라우터
│   │   ├── database/        # DB 연결 및 설정
│   │   ├── utils/           # 유틸리티 함수
│   │   └── types/           # TypeScript 타입 정의
│   ├── package.json
│   └── tsconfig.json
├── test/                     # 테스트 파일들
│   ├── unit/                # 단위 테스트
│   ├── integration/         # 통합 테스트
│   └── performance/         # 성능 테스트
├── database/                 # 데이터베이스 관련 파일
│   ├── schemas/             # 데이터베이스 스키마
│   ├── migrations/          # 마이그레이션 파일
│   ├── seeds/               # 시드 데이터
│   └── docker-compose.yml   # DB 컨테이너 설정
├── docs/                     # 문서
│   ├── api/                 # API 문서
│   ├── architecture/        # 시스템 아키텍처
│   └── development/         # 개발 가이드
├── docker-compose.yml
├── .gitignore
└── README.md
```

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
- [ ] 기존 DBMS 조사 및 특허 분석
- [ ] 우편번호 기반 데이터 스키마 설계

### Phase 2: 핵심 기능 개발 (4-7주차)
- [ ] 검색 구조 설계 및 갱신 인식 알고리즘 개발
- [ ] 데이터 변경 자동 인식 모듈 구현
- [ ] 인덱스 생성 및 성능 최적화
- [ ] 데이터 갱신 이력 저장 구조 설계
- [ ] 자동 갱신 모듈 및 버전 관리 기능

### Phase 3: 고급 기능 구현 (8-11주차)
- [ ] 데이터 무결성 검사 로직 설계
- [ ] 자동 리포터 생성 기능 구현
- [ ] 다국어 주소 변환 API 연동
- [ ] 다국어 매핑 모듈 및 국가별 포맷 변환

### Phase 4: 확장 기능 및 최적화 (12-15주차)
- [ ] 지역 개발 변화 감지 알고리즘
- [ ] 신규 개발 지역 인식 기능
- [ ] 실주소 데이터 패턴 검출
- [ ] 전체 모듈 통합 및 버그 수정
- [ ] 시스템 성능 평가 및 문서화

## 🧪 테스트 전략

테스트 주도 개발(TDD) 방식을 채택하여 `test/` 폴더에서 기능을 검증한 후 메인 코드로 이동하는 방식으로 진행합니다.

### 테스트 종류
- **Unit Tests**: 개별 함수 및 컴포넌트 테스트
- **Integration Tests**: 모듈 간 상호작용 테스트
- **Performance Tests**: 대용량 데이터 처리 성능 테스트

## 🎨 디자인 시스템

Apple-style 미니멀 디자인을 적용합니다:
- **Color Palette**: 화이트, 라이트 그레이, 다크 그레이, 블루 악센트
- **Typography**: SF Pro Display/Text 스타일의 폰트
- **Layout**: Clean, spacious, grid-based layout
- **Components**: Rounded corners, subtle shadows, smooth transitions

## 🤝 기여 방법

1. 이슈 생성 및 토의
2. 기능 브랜치 생성 (`feature/기능명`)
3. `test/` 폴더에서 기능 구현 및 테스트
4. 테스트 통과 후 메인 코드로 이동
5. Pull Request 생성

## 📝 라이센스

MIT License

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 통해 연락해 주세요.

---

**현재 상태**: Phase 1 - 프로젝트 초기 설정 완료
**다음 단계**: 데이터베이스 아키텍처 설계 및 우편번호 스키마 정의
