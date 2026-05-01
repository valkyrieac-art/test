# 청소년미래플러스 활동관리 시스템

금천중학교 1학년 학생 4명이 1년 동안 진행하는 활동 기록과 지원금 지출을 관리하는 모바일 우선 웹앱입니다.

## 폴더 구조

```text
youth-future-plus/
  supabase/schema.sql        # 테이블, 트리거, RLS, Storage 정책
  src/
    components/              # 공통 UI, 레이아웃, 권한 표시
    contexts/AuthContext.tsx # Supabase Auth 세션/프로필/역할
    lib/supabase.ts          # Supabase 클라이언트
    pages/                   # 로그인, 대시보드, CRUD, 통계, 설정
    services/                # activities, expenses, budgets, storage CRUD
    utils/                   # 금액/날짜/통계 계산
    types.ts                 # 앱 데이터 타입
```

## 주요 기능

- Supabase Auth 이메일/비밀번호 로그인
- `admin`, `user` 역할 구분
- 로그인하지 않은 사용자의 주요 화면 접근 차단
- 관리자만 활동내역/지출내역/예산 등록, 수정, 삭제 가능
- 일반 사용자는 조회만 가능하며 등록/수정/삭제 버튼 숨김
- 활동내역 CRUD, 검색, 날짜순 정렬, 사진 첨부
- 수입내역 CRUD, 증빙 사진 첨부, 총 수입/분류별/월별 합계
- 지출내역 CRUD, 영수증 첨부, 총 지출/남은 예산/분류별/월별 합계
- 대시보드와 차트 기반 통계
- 모바일 하단 탭, PC 좌측 메뉴 반응형 레이아웃

## 로컬 실행

```bash
cd youth-future-plus
npm install
cp .env.example .env
npm run dev
```

`.env`에는 Supabase 프로젝트 설정값을 입력합니다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`.env`를 아직 설정하지 않으면 데모 모드로 실행됩니다. 이 경우 브라우저 `localStorage`에 데이터가 저장되며, 아래 계정으로 기능을 바로 확인할 수 있습니다.

- 관리자: `admin` / `1234`
- 일반 사용자: `test1` / `test1`
- 일반 사용자: `test2` / `test2`

## Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 생성합니다.
2. Project Settings > API에서 `Project URL`과 `anon public key`를 복사해 `.env`에 입력합니다.
3. SQL Editor에서 [supabase/schema.sql](./supabase/schema.sql)을 전체 실행합니다.
4. Authentication > Providers에서 Email provider를 활성화합니다.
5. Storage에 `attachments` 버킷이 생성됐는지 확인합니다. SQL에서 자동 생성됩니다.

## 초기 테스트 계정

Authentication > Users에서 이메일 계정을 직접 생성합니다.

- 관리자 1명: 앱 로그인 `admin` / 비밀번호 `1234`
- 일반 사용자 2명: 앱 로그인 `test1` / 비밀번호 `test1`, `test2` / 비밀번호 `test2`

앱은 아이디를 Supabase 이메일로 변환해서 로그인합니다. Supabase Authentication > Users에는 아래 계정을 만듭니다.

| 앱 아이디 | Supabase 이메일 | 비밀번호 | 권한 |
| --- | --- | --- | --- |
| `admin` | `admin@youth-future-plus.local` | `1234` | 관리자 |
| `test1` | `test1@youth-future-plus.local` | `test1` | 일반 사용자 |
| `test2` | `test2@youth-future-plus.local` | `test2` | 일반 사용자 |

사용자를 만든 뒤 SQL Editor에서 최초 관리자만 승격합니다.

```sql
update public.profiles
set role = 'admin', full_name = '관리자'
where email = 'admin@youth-future-plus.local';

update public.profiles
set role = 'user', full_name = '사용자1'
where email = 'test1@youth-future-plus.local';

update public.profiles
set role = 'user', full_name = '사용자2'
where email = 'test2@youth-future-plus.local';
```

Supabase 프로젝트의 비밀번호 최소 길이 정책 때문에 4자리 비밀번호가 거부되면 Authentication 설정에서 최소 길이를 낮추거나, 테스트용 비밀번호를 6자리 이상으로 만든 뒤 앱 로그인 안내 문구도 함께 바꾸세요.

## 권한 정책

[supabase/schema.sql](./supabase/schema.sql)은 다음 RLS를 적용합니다.

- 인증된 사용자는 `profiles`, `activities`, `incomes`, `expenses`, `budgets` 조회 가능
- `admin`만 `insert`, `update`, `delete` 가능
- 사진/영수증 파일은 `attachments` Storage 버킷에 업로드
- Storage 업로드, 수정, 삭제도 `admin`만 가능

## GitHub 업로드

```bash
git init
git add .
git commit -m "Create youth future plus app"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

이미 Git 저장소 안에서 작업한다면 `youth-future-plus` 폴더만 커밋하면 됩니다.

## Vercel 배포

1. Vercel에서 GitHub 저장소를 Import합니다.
2. Framework Preset은 `Vite`를 선택합니다.
3. Root Directory가 저장소 루트가 아니라면 `youth-future-plus`로 지정합니다.
4. Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 추가합니다.
5. Deploy를 실행합니다.

## GitHub Pages 배포

Vercel을 권장합니다. GitHub Pages를 사용할 경우 Vite 정적 빌드는 가능하지만 SPA 라우팅 새로고침 처리가 추가로 필요합니다.

```bash
npm run build
```

`dist` 폴더를 GitHub Pages에 배포하거나, GitHub Actions에서 `npm ci`, `npm run build`, Pages upload 순서로 배포합니다. 저장소가 서브 경로에 배포된다면 `vite.config.ts`에 `base: '/저장소명/'` 설정을 추가하세요.
