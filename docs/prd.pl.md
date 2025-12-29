# Dokument wymagań produktu (PRD) - AI Flashcard Generator

## 1. Przegląd produktu

AI Flashcard Generator to aplikacja internetowa zaprojektowana, aby pomóc studentom w efektywniejszej nauce poprzez automatyzację procesu tworzenia fiszek. Aplikacja wykorzystuje sztuczną inteligencję do generowania propozycji fiszek na podstawie tekstu dostarczonego przez użytkownika, co znacznie skraca czas potrzebny na ich przygotowanie. Użytkownicy mogą przeglądać, edytować i akceptować wygenerowane fiszki, a następnie korzystać z nich w zintegrowanym systemie powtórek opartym na algorytmie spaced repetition (SRS), aby zoptymalizować proces zapamiętywania. MVP produktu skupia się na podstawowych funkcjonalnościach generowania, zarządzania i nauki, z prostym systemem uwierzytelniania użytkowników.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje produkt, jest czasochłonność i pracochłonność manualnego tworzenia wysokiej jakości fiszek edukacyjnych. Wielu studentów rezygnuje z metody nauki opartej na powtórkach (spaced repetition), ponieważ barierą jest dla nich konieczność samodzielnego przygotowywania dużej liczby fiszek z materiałów do nauki, takich jak notatki z wykładów czy podręczniki. Proces ten jest postrzegany jako monotonny i zniechęcający, co ogranicza wykorzystanie jednej z najskuteczniejszych technik uczenia się.

## 3. Wymagania funkcjonalne

### 3.1. System uwierzytelniania użytkowników

- Użytkownik może założyć konto, podając unikalną nazwę użytkownika i hasło.
- Użytkownik może zalogować się na swoje konto przy użyciu nazwy użytkownika i hasła.
- Sesja użytkownika jest zarządzana za pomocą tokenów JWT (JSON Web Token).

### 3.2. Generowanie fiszek z tekstu

- Użytkownik może wkleić lub wpisać tekst (do 10 000 znaków) w dedykowanym polu tekstowym.
- Aplikacja obsługuje tekst wejściowy w języku polskim i angielskim.
- System wykorzystuje darmowy model AI do analizy tekstu i generowania listy propozycji fiszek (kandydatów).

### 3.3. Proces recenzji fiszek

- Po wygenerowaniu, użytkownik jest przekierowywany do dedykowanego interfejsu recenzji.
- Dla każdej propozycji fiszki użytkownik ma trzy opcje:
  - Akceptuj: Zapisuje fiszkę bez zmian.
  - Edytuj: Pozwala na modyfikację pytania i/lub odpowiedzi przed zapisaniem.
  - Odrzuć: Usuwa propozycję z listy.
- Zmiany (zaakceptowane, zedytowane fiszki) są zapisywane w bazie danych użytkownika dopiero po kliknięciu przycisku "Zakończ recenzję".

### 3.4. Zarządzanie fiszkami

- Użytkownik ma dostęp do widoku listy wszystkich swoich zapisanych fiszek (zaakceptowanych i zedytowanych).
- Lista wyświetla pytanie i odpowiedź dla każdej fiszki.
- Użytkownik może manualnie tworzyć nowe fiszki.
- Użytkownik może edytować istniejące fiszki.
- Użytkownik może usuwać fiszki ze swojej kolekcji.

### 3.5. Sesja nauki (Spaced Repetition)

- Aplikacja integruje się z gotową biblioteką open-source do obsługi algorytmu powtórek (np. implementacja SM-2).
- Użytkownik może rozpocząć sesję nauki, podczas której system prezentuje fiszki do powtórki.
- Po wyświetleniu odpowiedzi, użytkownik ocenia swoją znajomość fiszki na 6-stopniowej skali (0-5).
- Na podstawie oceny algorytm oblicza i planuje datę następnej powtórki.

### 3.6. Wielojęzyczność interfejsu

- Interfejs użytkownika jest dostępny w języku polskim i angielskim.
- Użytkownik może przełączać język interfejsu.
- Wybór języka jest zapamiętywany w przeglądarce użytkownika.

### 3.7. Statystyki generowania fiszek

- Zbieranie informacji o tym ile fiszek zostało zaakceptowanych po wygenerowaniu ich przez AI.

## 4. Granice produktu

### 4.1. Funkcjonalności w zakresie MVP

- Uwierzytelnianie użytkownika oparte wyłącznie na loginie i haśle (JWT).
- Generowanie fiszek przez AI na podstawie wklejonego tekstu (do 10 000 znaków).
- Manualne tworzenie, przeglądanie, edycja i usuwanie fiszek.
- Przechowywanie wszystkich fiszek użytkownika na jednej, wspólnej liście.
- Integracja z gotowym, zewnętrznym algorytmem SRS (np. SM-2).
- Interfejs sesji nauki z 6-stopniową skalą ocen.
- Obsługa języka polskiego i angielskiego dla generowania fiszek i interfejsu.

### 4.2. Funkcjonalności poza zakresem MVP

- Zaawansowany, autorski algorytm powtórek (jak w SuperMemo czy Anki).
- Import plików w formatach PDF, DOCX, itp.
- Tworzenie "talii" lub folderów do grupowania fiszek.
- Paginacja, filtrowanie i wyszukiwanie na liście fiszek.
- Współdzielenie zestawów fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Dedykowane aplikacje mobilne (iOS, Android).
- Logowanie przez dostawców zewnętrznych (np. Google, Facebook).
- Funkcje "zapomniałem hasła" i weryfikacja adresu e-mail.

### 4.3. Nierozwiązane kwestie i ryzyka

- Ostateczny wybór biblioteki open-source do obsługi SRS wymaga dalszej analizy technicznej.
- Jakość fiszek generowanych przez darmowy model AI może być niewystarczająca do osiągnięcia zakładanych metryk sukcesu. Należy przeprowadzić testy porównawcze i przygotować plan awaryjny.
- Projekt interfejsu użytkownika dla procesu masowej recenzji fiszek wymaga szczegółowego opracowania w fazie UX/UI.

## 5. Historyjki użytkowników

### 5.1. Zarządzanie kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji, używając unikalnej nazwy użytkownika i hasła, aby móc zapisywać swoje fiszki.
- Kryteria akceptacji:

  - Formularz rejestracji zawiera pola "Nazwa użytkownika" i "Hasło".
  - System sprawdza, czy nazwa użytkownika jest już zajęta.
  - Hasło musi spełniać minimalne wymogi bezpieczeństwa (np. 8 znaków).
  - Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego panelu.

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, podając nazwę użytkownika i hasło, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:

  - Formularz logowania zawiera pola "Nazwa użytkownika" i "Hasło".
  - Po poprawnym uwierzytelnieniu otrzymuję token JWT.
  - Po zalogowaniu jestem przekierowany do głównego panelu.
  - W przypadku błędnych danych wyświetlany jest odpowiedni komunikat.

- ID: US-003
- Tytuł: Wylogowanie z systemu
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby bezpiecznie zakończyć sesję.
- Kryteria akceptacji:
  - W interfejsie znajduje się przycisk "Wyloguj".
  - Po kliknięciu przycisku token sesji jest unieważniany po stronie klienta.
  - Zostaję przekierowany na stronę logowania.

### 5.2. Generowanie i recenzja fiszek

- ID: US-004
- Tytuł: Generowanie fiszek z tekstu
- Opis: Jako student, chcę wkleić fragment notatek z wykładu, aby system automatycznie wygenerował dla mnie propozycje fiszek, oszczędzając mój czas.
- Kryteria akceptacji:

  - Na stronie głównej znajduje się pole tekstowe, które akceptuje do 10 000 znaków.
  - Po wklejeniu tekstu i kliknięciu przycisku "Generuj" system rozpoczyna proces w tle.
  - Po zakończeniu generowania jestem przekierowywany do widoku recenzji fiszek.

- ID: US-005
- Tytuł: Recenzja wygenerowanych fiszek
- Opis: Jako student, chcę szybko przejrzeć wygenerowane fiszki, zaakceptować te dobre, poprawić te wymagające korekty i odrzucić słabe, aby zbudować wartościowy zestaw do nauki.
- Kryteria akceptacji:
  - Widok recenzji wyświetla listę "kandydatów" na fiszki, każda z pytaniem i odpowiedzią.
  - Przy każdej propozycji znajdują się przyciski: "Akceptuj", "Edytuj", "Odrzuć".
  - Kliknięcie "Akceptuj" oznacza fiszkę jako gotową do dodania.
  - Kliknięcie "Odrzuć" usuwa propozycję z listy.
  - Kliknięcie "Edytuj" otwiera formularz pozwalający na zmianę treści pytania i odpowiedzi.
  - Po edycji mogę zapisać zmiany, a fiszka jest oznaczana jako "zedytowana".
  - Po przejrzeniu wszystkich propozycji, klikam "Zakończ recenzję", co zapisuje zaakceptowane i zedytowane fiszki na moim koncie.

### 5.3. Zarządzanie fiszkami

- ID: US-006
- Tytuł: Ręczne tworzenie fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki, gdy mam konkretne pytanie i odpowiedź do zapamiętania.
- Kryteria akceptacji:

  - W interfejsie dostępny jest przycisk "Dodaj nową fiszkę".
  - Po kliknięciu pojawia się formularz z polami "Pytanie" i "Odpowiedź".
  - Po wypełnieniu i zapisaniu, nowa fiszka pojawia się na mojej liście fiszek.

- ID: US-007
- Tytuł: Przeglądanie listy fiszek
- Opis: Jako użytkownik, chcę widzieć wszystkie moje fiszki na jednej liście, aby mieć przegląd materiału, którego się uczę.
- Kryteria akceptacji:

  - Dostępna jest strona "Moje fiszki", która wyświetla listę wszystkich moich fiszek.
  - Każdy element listy pokazuje treść pytania i odpowiedzi.
  - Lista nie posiada paginacji ani opcji filtrowania w MVP.

- ID: US-008
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować moje istniejące fiszki, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:

  - Przy każdej fiszce na liście znajduje się opcja "Edytuj".
  - Kliknięcie jej otwiera formularz z załadowaną treścią pytania i odpowiedzi.
  - Po zapisaniu zmian, fiszka na liście jest zaktualizowana.

- ID: US-009
- Tytuł: Usuwanie fiszki
- Opis: Jako użytkownik, chcę móc usunąć fiszkę, której już nie potrzebuję.
- Kryteria akceptacji:
  - Przy każdej fiszce na liście znajduje się opcja "Usuń".
  - Po kliknięciu wyświetlane jest potwierdzenie operacji.
  - Po potwierdzeniu fiszka jest trwale usuwana z mojego konta.

### 5.4. Nauka

- ID: US-010
- Tytuł: Rozpoczęcie sesji nauki
- Opis: Jako student, chcę rozpocząć sesję nauki, podczas której system będzie prezentował mi fiszki zgodnie z algorytmem spaced repetition, abym mógł efektywnie się uczyć.
- Kryteria akceptacji:

  - Na stronie głównej znajduje się przycisk "Rozpocznij naukę".
  - System wybiera fiszki, których termin powtórki minął.
  - Jeśli nie ma fiszek do powtórki, wyświetlany jest odpowiedni komunikat.

- ID: US-011
- Tytuł: Ocenianie odpowiedzi
- Opis: Jako student, po zobaczeniu odpowiedzi na fiszce, chcę ocenić, jak dobrze ją znałem, aby algorytm mógł zaplanować kolejną powtórkę w optymalnym czasie.
- Kryteria akceptacji:
  - W trakcie sesji nauki najpierw wyświetlane jest tylko pytanie.
  - Po kliknięciu przycisku "Pokaż odpowiedź" ujawniana jest odpowiedź.
  - Pod odpowiedzią znajduje się 6 przycisków z ocenami (od 0 do 5).
  - Po wybraniu oceny, system zapisuje ją i przechodzi do następnej fiszki w sesji.
  - Po zakończeniu sesji wyświetlane jest podsumowanie.

### 5.5. Ustawienia

- ID: US-012
- Tytuł: Zmiana języka interfejsu
- Opis: Jako użytkownik, chcę móc przełączyć język interfejsu między polskim a angielskim, aby korzystać z aplikacji w preferowanym języku.
- Kryteria akceptacji:
  - W interfejsie znajduje się przełącznik języka (np. flaga lub skrót "PL/EN").
  - Po zmianie języka cały interfejs aplikacji jest natychmiast tłumaczony.
  - Wybór języka jest zapisywany w `localStorage` przeglądarki i jest pamiętany podczas kolejnych wizyt.

## 6. Metryki sukcesu

### 6.1. Wskaźnik Akceptacji AI

- Cel: Co najmniej 75% fiszek generowanych przez AI jest akceptowanych przez użytkowników bez edycji.
- Sposób pomiaru: Mierzone globalnie w systemie jako stosunek liczby fiszek, przy których użytkownik kliknął "Akceptuj", do całkowitej liczby wygenerowanych kandydatów na fiszki.
- Wzór: `(Liczba fiszek zaakceptowanych bez edycji) / (Całkowita liczba wygenerowanych kandydatów) >= 0.75`

### 6.2. Adopcja Funkcji AI

- Cel: Co najmniej 75% wszystkich nowo utworzonych fiszek w systemie pochodzi z generatora AI (a nie z tworzenia manualnego).
- Sposób pomiaru: Mierzone jako stosunek liczby fiszek utworzonych za pomocą generatora AI (zaakceptowanych i zedytowanych) do łącznej liczby wszystkich nowo utworzonych fiszek (z AI i manualnie).
- Wzór: `(Liczba fiszek z AI) / (Łączna liczba nowych fiszek) >= 0.75`
