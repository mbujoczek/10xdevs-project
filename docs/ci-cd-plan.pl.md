# Plan Implementacji CI/CD i Konteneryzacji

## 1. Wprowadzenie i Cele

Ten dokument opisuje strategię wdrożenia potoku CI/CD przy użyciu GitHub Actions oraz konteneryzacji aplikacji za pomocą Dockera. Główne cele to:

- **Automatyzacja**: Zautomatyzowanie procesów testowania, budowania i wdrażania.
- **Spójność**: Zapewnienie spójnego i powtarzalnego środowiska zarówno dla rozwoju lokalnego, jak i dla produkcji, dzięki użyciu Dockera.
- **Bezpieczeństwo**: Bezpieczne zarządzanie sekretami, takimi jak klucze API i hasła do bazy danych.
- **Niezawodność**: Stworzenie ustrukturyzowanego i niezawodnego przepływu pracy dla wydawania nowych wersji aplikacji.

Strategia opiera się na przepływie Git, w którym gałęzie funkcyjne (`feature branches`) są łączone z `develop`, a `develop` jest okresowo łączony z `main` w celu stworzenia wydania produkcyjnego.

## 2. Strategia Konteneryzacji

Aplikacja zostanie podzielona na trzy główne skonteneryzowane usługi, zarządzane przez Docker Compose na potrzeby rozwoju lokalnego: `frontend`, `backend` i `db`.

### 2.1. Struktura Plików

```
/
├── backend/
│   └── Dockerfile              # Dockerfile dla backendu .NET
├── frontend/
│   └── Dockerfile              # Dockerfile dla frontendu Vue.js
├── .dockerignore               # Wyklucza niepotrzebne pliki z kontekstu budowania
├── docker-compose.yml          # Zarządza wszystkimi usługami lokalnie
├── .env                        # Lokalne sekrety (ignorowane przez Git)
└── .env.example                # Wzór wymaganych sekretów
```

### 2.2. Dockerfile Backendu (`/backend/Dockerfile`)

Zostanie zastosowane budowanie wieloetapowe (multi-stage build), aby stworzyć mały, zoptymalizowany obraz produkcyjny.

- **Etap `build`**: Używa obrazu `.NET SDK` do przywrócenia zależności, zbudowania i opublikowania aplikacji. Kontekstem budowania będzie katalog `/backend`.
- **Etap `final`**: Używa lekkiego obrazu `.NET ASP.NET Runtime` i kopiuje jedynie opublikowane artefakty z etapu budowania.

### 2.3. Dockerfile Frontendu (`/frontend/Dockerfile`)

Tutaj również zostanie zastosowane budowanie wieloetapowe.

- **Etap `build`**: Używa obrazu `node` do instalacji zależności (`npm ci`) i zbudowania aplikacji Vue.js (`npm run build`).
- **Etap `final`**: Używa lekkiego obrazu `nginx`. Zbudowane pliki statyczne z katalogu `dist` zostaną skopiowane. Zostanie dodana niestandardowa konfiguracja `nginx.conf`, aby poprawnie serwować aplikację SPA (Single Page Application) i działać jako odwrotne proxy (reverse proxy) dla API backendu, co pozwoli uniknąć problemów z CORS w środowisku lokalnym.

### 2.4. Usługa Bazy Danych (`db`)

- **Obraz**: `mcr.microsoft.com/mssql/server:2022-latest`.
- **Konfiguracja**: Usługa zostanie skonfigurowana w `docker-compose.yml`.
- **Trwałość Danych**: Zostanie użyty nazwany wolumen Dockera (np. `db-data`), aby dane bazy danych były trwałe i nie znikały po restarcie kontenera.
- **Zależności**: Usługa `backend` zostanie skonfigurowana z `depends_on`, aby zapewnić, że baza danych uruchomi się jako pierwsza.

### 2.5. Zarządzanie Konfiguracją i Sekretami (Lokalnie)

Zostanie wprowadzone wyraźne rozróżnienie między konfiguracją (danymi niewrażliwymi, specyficznymi dla środowiska) a sekretami (danymi wrażliwymi).

- **Scentralizowana Konfiguracja**: Plik `docker-compose.yml` stanie się jedynym źródłem prawdy dla konfiguracji środowiska podczas pracy lokalnej. Wszystkie zmienne z `appsettings.json` i `frontend/.env` (takie jak nazwy baz danych, issuer, czy adresy URL API) zostaną tam zdefiniowane. Centralizuje to ustawienia i ułatwia przegląd całej konfiguracji środowiska.

- **Lokalne Sekrety (plik `.env`)**: Wszystkie sekrety wymagane do rozwoju lokalnego (np. `OPENROUTER_API_KEY`, `DB_SA_PASSWORD`, `JWT_SECRET_KEY`) będą przechowywane w pliku `.env` w głównym katalogu projektu.
  - **`.gitignore`**: Plik `.env` zostanie dodany do `.gitignore`, aby zapobiec jego przypadkowemu dodaniu do repozytorium.
  - **`docker-compose.yml`**: Plik compose będzie automatycznie odczytywał sekrety z pliku `.env` i przekazywał je jako zmienne środowiskowe do odpowiednich kontenerów. Zostanie wykorzystane wiązanie konfiguracji .NET (np. `Jwt__SecretKey=${JWT_SECRET_KEY}`), aby zmapować te zmienne na struktury w `appsettings.json`.
  - **`.env.example`**: Plik wzorcowy zostanie dodany do repozytorium, aby pokazać innym deweloperom, które zmienne środowiskowe są wymagane, bez ujawniania jakichkolwiek wartości.

## 3. Strategia CI/CD z GitHub Actions

Proces CI/CD będzie zarządzany przez trzy główne przepływy pracy (workflows) i dwie akcje kompozytowe (composite actions).

### 3.1. Struktura Plików

```
.github/
├── actions/
│   ├── backend-build-test/
│   │   └── action.yml      # Akcja kompozytowa dla kroków CI backendu
│   └── frontend-build-test/
│       └── action.yml      # Akcja kompozytowa dla kroków CI frontendu
└── workflows/
    ├── pr-checks.yml           # Uruchamiany przy PR do develop i main
    ├── release-drafter.yml     # Tworzy wersje robocze wydań przy push do main
    └── deploy-production.yml   # Wdraża na produkcję po publikacji wydania
```

### 3.2. Akcje Kompozytowe (`.github/actions/`)

- **`backend-build-test`**: Akcja wielokrotnego użytku, która konfiguruje środowisko .NET, przywraca zależności, buduje solucję i uruchamia testy xUnit.
- **`frontend-build-test`**: Akcja wielokrotnego użytku, która konfiguruje Node.js, instaluje zależności (`npm ci`), lintuje kod i uruchamia testy jednostkowe Vitest.

### 3.3. Przepływy Pracy (`.github/workflows/`)

- **`pr-checks.yml`**:
  - **Wyzwalacz**: `pull_request` do gałęzi `develop` i `main`.
  - **Cel**: Zapewnienie jakości kodu i zapobieganie łączeniu wadliwego kodu. Uruchomi zarówno akcję `backend-build-test`, jak i `frontend-build-test`.

- **`release-drafter.yml`**:
  - **Wyzwalacz**: `push` do gałęzi `main`.
  - **Cel**: Automatyzacja tworzenia notatek do wydania. Używa akcji `release-drafter/release-drafter` do tworzenia wersji roboczej wydania, agregując wszystkie zmiany od ostatniego wydania. Ułatwia to ręczny proces publikacji nowej wersji.

- **`deploy-production.yml`**:
  - **Wyzwalacz**: `release` z typem `published`.
  - **Cel**: Automatyzacja wdrożenia na środowisko produkcyjne.
  - **Kroki**:
    1. Zdefiniowanie zadania (job), które będzie uruchamiane w środowisku `production`.
    2. Pobranie kodu odpowiadającego tagowi wydania.
    3. Zbudowanie i wypchnięcie obrazów Docker dla frontendu i backendu do rejestru kontenerów (np. GitHub Container Registry, Docker Hub, Azure Container Registry).
    4. Wyzwolenie wdrożenia na infrastrukturze produkcyjnej (np. za pomocą `ssh` do uruchomienia `docker-compose pull && docker-compose up -d` na serwerze VPS, lub używając dedykowanych akcji dla dostawców chmurowych, takich jak Azure czy AWS).

  **Uwaga dotycząca Migracji Bazy Danych**: Migracje EF Core będą aplikowane automatycznie podczas startu aplikacji backendowej. Jest to skonfigurowane w kodzie startowym aplikacji poprzez wywołanie `context.Database.Migrate()` przed rozpoczęciem przyjmowania requestów.

### 3.4. Zarządzanie Sekretami (CI/CD)

- **Środowiska GitHub**: W ustawieniach repozytorium zostanie skonfigurowane środowisko "production".
- **GitHub Secrets**: Wszystkie sekrety produkcyjne (`OPENROUTER_API_KEY`, `DB_SA_PASSWORD`, dane logowania do rejestru kontenerów itp.) będą przechowywane jako zaszyfrowane sekrety w ramach środowiska "production".
- **Dostęp w Przepływie Pracy**: Przepływ `deploy-production.yml` zostanie skonfigurowany do używania środowiska `production`, co zapewni mu bezpieczny dostęp do niezbędnych sekretów. Gwarantuje to, że sekrety są dostępne tylko dla zadania wdrożeniowego, a nie dla innych przepływów pracy.
