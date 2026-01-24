<conversation_summary>

<decisions>

1. Główną grupą docelową produktu są studenci.
2. Aplikacja wykorzysta gotową bibliotekę open-source do obsługi algorytmu powtórek (wstępnie założono SuperMemo.NET).
3. Proces generowania fiszek polega na stworzeniu przez AI kilku "kandydatów", które użytkownik recenzuje w ramach jednej sesji. Decyzje (akceptacja, edycja, odrzucenie) są zapisywane w bazie danych dopiero po naciśnięciu przycisku "Zakończ recenzję".
4. Kryterium sukcesu (75% akceptacji) będzie mierzone jako stosunek fiszek zaakceptowanych bez edycji do wszystkich wygenerowanych kandydatów na fiszki w całym systemie.
5. Aplikacja i generowanie fiszek będą obsługiwać język angielski (domyślny) i polski.
6. Limit znaków dla tekstu wejściowego do generowania fiszek wynosi 10 000.
7. System kont będzie oparty wyłącznie o login i hasło z uwierzytelnianiem JWT. Nie będzie logowania przez dostawców zewnętrznych, weryfikacji e-mail ani funkcji "zapomniałem hasła" w MVP.
8. W MVP nie będzie systemu "talii". Wszystkie fiszki użytkownika będą znajdować się na jednej liście, bez paginacji i filtrowania na start.
9. Model AI do generowania fiszek musi być darmowy.
10. Interfejs sesji nauki będzie oparty na 6-stopniowej skali ocen (0-5) zgodnej z algorytmem SuperMemo (SM-2).
11. Fiszki edytowane przez użytkownika będą liczone jako "zedytowane" (nie "zaakceptowane") na potrzeby metryk, ale będą normalnie dostępne w trybie nauki.

</decisions>

<matched_recommendations>

1. Zdefiniowanie persony użytkownika (studenci) w celu ukierunkowania projektu UX i komunikacji.
2. Stworzenie dedykowanego procesu "recenzji", w którym użytkownik weryfikuje wygenerowane fiszki przed ich ostatecznym zapisaniem.
3. Precyzyjne zdefiniowanie metryki "akceptacji" jako akcji kliknięcia przycisku "Akceptuj" bez uprzedniej edycji fiszki.
4. Implementacja prostego systemu uwierzytelniania opartego na loginie/haśle i JWT, z minimalnym zestawem danych (`userId`) w payloadzie.
5. Dodanie prostego przełącznika języka w interfejsie użytkownika, z zapamiętywaniem wyboru w przeglądarce.
6. Rozróżnienie w metrykach fiszek "zaakceptowanych" od "zedytowanych" w celu dokładniejszego pomiaru jakości modelu AI.
7. Zaprojektowanie interfejsu sesji nauki w sposób dopasowany do wymagań wybranej biblioteki SRS (skala ocen SM-2).

</matched_recommendations>

<prd_planning_summary>

Na podstawie przeprowadzonej dyskusji, PRD dla MVP powinno skupić się na następujących elementach:

a. Główne wymagania funkcjonalne produktu:

System Użytkowników: Rejestracja i logowanie za pomocą loginu i hasła. Uwierzytelnianie oparte na JWT. Brak funkcji resetowania hasła i weryfikacji e-mail.
Generowanie Fiszek: Użytkownik wkleja tekst (do 10 000 znaków) w języku polskim lub angielskim. System, używając darmowego modelu AI, generuje listę "kandydatów" na fiszki.
Recenzja Fiszek: Użytkownik przechodzi do dedykowanego widoku recenzji, gdzie dla każdego kandydata może wybrać jedną z trzech opcji: Akceptuj, Edytuj, Odrzuć. Zmiany są zapisywane do bazy danych hurtowo po zakończeniu recenzji.
Zarządzanie Fiszkami: Wszystkie zaakceptowane i zedytowane fiszki użytkownika są wyświetlane na jednej liście.
Nauka: System integruje się z biblioteką open-source (np. SuperMemo.NET) do obsługi powtórek. Interfejs sesji nauki pozwala użytkownikowi ocenić swoją odpowiedź na 6-stopniowej skali (0-5).
Wielojęzyczność: Interfejs aplikacji jest dostępny w języku polskim i angielskim, z możliwością przełączania.

b. Kluczowe historie użytkownika i ścieżki korzystania:

Ścieżka generowania fiszek: Jako student, chcę wkleić fragment notatek z wykładu, aby system automatycznie wygenerował dla mnie propozycje fiszek. Następnie chcę je szybko przejrzeć, zaakceptować te dobre, poprawić te wymagające korekty i odrzucić słabe, a na koniec zapisać je wszystkie na moim koncie.
Ścieżka nauki: Jako student, chcę rozpocząć sesję nauki, podczas której system będzie prezentował mi fiszki zgodnie z algorytmem spaced repetition. Po zobaczeniu odpowiedzi chcę ocenić, jak dobrze ją znałem, aby algorytm mógł zaplanować kolejną powtórkę.
Ścieżka zarządzania fiszkami: Jako student, chcę mieć możliwość przejrzenia wszystkich moich fiszek - pytań i odpowiedzi.

c. Ważne kryteria sukcesu i sposoby ich mierzenia:

Wskaźnik Akceptacji AI: Co najmniej 75% fiszek generowanych przez AI jest akceptowanych przez użytkowników bez edycji. Mierzone globalnie jako (liczba fiszek zaakceptowanych) / (całkowita liczba wygenerowanych kandydatów).
Adopcja Funkcji AI: Co najmniej 75% wszystkich nowo utworzonych fiszek w systemie pochodzi z generatora AI (a nie z tworzenia manualnego). Mierzone jako (liczba fiszek z AI) / (łączna liczba nowych fiszek).

</prd_planning_summary>

<unresolved_issues>

**Wybór i analiza biblioteki SRS:**
Należy ostatecznie wybrać bibliotekę open-source (np. SuperMemo.NET, fsrs.js) i szczegółowo przeanalizować jej API oraz wymagania dotyczące danych wejściowych, aby zapewnić kompatybilność.

**Ryzyko jakości darmowego modelu AI:**
Jakość fiszek z darmowego modelu może być niewystarczająca do osiągnięcia celu 75% akceptacji. Należy przeprowadzić testy z kilkoma modelami i przygotować plan awaryjny (np. obniżenie progu sukcesu).

**Projekt interfejsu "sesji recenzji":** Należy szczegółowo zaprojektować interfejs i przepływ masowej recenzji fiszek, aby był on intuicyjny i efektywny dla użytkownika.

</unresolved_issues>

</conversation_summary>
