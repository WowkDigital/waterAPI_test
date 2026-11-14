---
doc_id: challenges_decision_matrix_and_deep_dive
title: "HackNation 2026 — Wielokryterialna macierz wyboru zadania i karty decyzyjne (10/15 + protokół 11:00)"
edition: "2026"
source_json: "../data/challenges_decision_matrix.json"
status: "verified_against_sources"
language: "pl"
audience: ["participants", "ai_agents"]
---

# HackNation 2026 — Wielokryterialna analiza zadań i wybór najlepszego wyzwania pod Twój profil

Ten dokument służy jako **narzędzie decyzyjne** do dobrania optymalnego zadania na HackNation 2026 (21–22 listopada 2026 r., BCTW Bydgoszcz). Dane liczbowe dotyczące pul nagród, liczby mentorów i reguł HackTribe pochodzą bezpośrednio z `hacknation.pl` i regulaminu, natomiast **punktacja w skali 1–5 oraz szacowany tłok i balans UX/Backend są ustrukturyzowaną oceną analityczną** opartą na treściach 10 opublikowanych zadań, stanowiskach 105 mentorów oraz wynikach HackNation 2025 i HackYeah.

---

## 1. Definicja 12 kryteriów analizy (w 4 wymiarach)

### Wymiar I — Technologia i dane
1. **`C1` Dominujący ciężar techniczny:** główna kompetencja bez której rozwiązanie będzie powierzchowne (*LLM/RAG & Document AI*, *Computer Vision / Multimodal ML*, *Cybersec / EASM / AppSec*, *Blockchain Forensics / Graph OSINT*, *GIS / Teledetekcja*, *Product / Mobile UX / Deterministyczne reguły*).
2. **`C2` Próg wiedzy domenowej (1–5):** im wyższy próg (np. EASM, krypto-OSINT, prawo świadczeń ZUS), tym większa szansa dla specjalistów i mniejszy napływ losowych zespołów.
3. **`C3` Zależność od zewnętrznych API, scrapingu lub paczki danych o 11:00 (1–5):** im wyższa, tym większe ryzyko utknięcia w 24-godzinnym sprincie na limitach API lub nieoczekiwanym formacie danych partnera.
4. **`C12` Potencjał legalnego przygotowania przed 21.11 godz. 11:00 (1–5):** jak dużą część źródeł publicznych/wiedzy domenowej możesz zbadać wcześniej *(pamiętając o wymogu z FAQ, by w prezentacji jawnie wskazać kod/zasoby powstałe przed hackathonem)*.

### Wymiar II — Konkurencja i skład zespołu
5. **`C4` Przewidywany tłok konkurencyjny (1–5):** *1 = niski tłok / nisza, 5 = bardzo oblegany temat*. Ponieważ do finału (Etapu 2) wchodzi **TOP 5 niezależnie od wielkości kategorii**, niski tłok drastycznie podnosi prawdopodobieństwo awansu.
6. **`C5` Wykonalność Solo / Duo w 24h (1–5):** czy 1–2 osoby dowiozą spójne MVP (w 2025 r. 2 zadania zostały wygrane solo: *052 Quest* i *Industrial Risk Monitor*).
7. **`C6` Synergia zespołu 3–6 osobowego (1–5):** czy zadanie łatwo podzielić na równoległe tory (ML/Backend, Frontend/UX, Domena, Pitch/Wideo).

### Wymiar III — Ekonomia i wsparcie instytucjonalne
8. **`C7` Jawność i wysokość puli nagród:** 3 zadania mają jawną pulę już teraz (**25 000 PLN** dla *RISK MINER* i *ATTACK SURFACE INTELLIGENCE*, **11 111 PLN** dla *RADAR INNOWACJI*); pozostałe 7 oznaczono jako *TBA* (dla porównania w 2025 r. standardem było **25 000 PLN** na zadanie).
9. **`C8` Siła i profil ławki mentorskiej (`/mentorzy`):** obecność konkretnych ról (np. 11 osób w COI w tym dyrekcja UX Research, czy 7 badaczy biometrii i AI w NASK) zdradza, czego dokładnie szukają jurorzy.

### Wymiar IV — Egzekucja i ryzyka
10. **`C9` Balans UX/Frontend vs Algorytm/Backend (%):** pozwala dopasować zadanie do silnych stron Twojego składu.
11. **`C10` Potencjał efektu WOW w wideo 2 min i pitchu (1–5):** w Etapie 1 juror ma kilka minut na ocenę PDF (≤ 10 MB) + wideo (≤ 2 min), a w Etapie 2 punkty z Etapu 1 **nie przechodzą dalej** — wygrywa prezentacja na żywo.
12. **`C11` Ryzyko pułapek regulacyjnych lub halucynacji LLM (1–5):** np. AI Act High-Risk w HR (*MC*), błędy w stawkach/terminach (*ZUS*), brak ścieżki dowodowej (*MF/KAS*, *NASK*), skanowanie poza zakresem (*AGH*).

---

## 2. Zbiorcza Macierz Porównawcza (10 opublikowanych zadań)

*(Skala 1–5: **C2** 5=bardzo trudna domena | **C3** 5=duża zależność danych | **C4** 1=mały tłok / 5=ogromny tłok | **C5** 5=super dla solo/duo | **C6** 5=super dla dużego zespołu | **C10** 5=ogromne WOW | **C11** 5=wysokie ryzyko prawne/halucynacji | **C12** 5=dużo da się zbadać przed 21.11)*

| Zadanie (Partner) | C1 Profil | C2 Domena | C3 API/Dane | C4 Tłok | C5 Solo/Duo | C6 Team 3-6 | C9 UX / Alg | C10 WOW | C11 Pułapki | C12 Prep | C8 Mentorzy | C7 Pula |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1. RISK MINER** *(MFiPR)* | RAG / Doc AI | 4 | 3 | 4 | 4 | 4 | 35 / 65 | 4 | 4 | 4 | 3 | **25 000 PLN** |
| **2. ATTACK SURFACE INTELLIGENCE** *(AGH)* | Cybersec EASM | 5 | 3 | **2** | 4 | 4 | 30 / 70 | 4 | 4 | 5 | 2 | **25 000 PLN** |
| **3. RADAR INNOWACJI** *(PCI)* | RAG / Matching | 2 | 4 | **2** | **5** | 3 | 50 / 50 | 4 | **1** | 4 | 3 | **11 111 PLN** |
| **4. KOMPAS KOMPETENCJI** *(BDG MC)* | Product / HR UX | 3 | 2 | 3 | **5** | 4 | 60 / 40 | 3 | **5** | 4 | 5 (+7 KPRM) | TBA |
| **5. KOLEKCJONER FEJKÓW** *(NASK)* | CV / Multimodal | 4 | 4 | 4 | 2 | **5** | 30 / 70 | **5** | 3 | 4 | 7 | TBA |
| **6. CYFRYZACJA FORMULARZY** *(COI)* | Doc-to-App / UX | 3 | 2 | **5** | 3 | **5** | 55 / 45 | **5** | 3 | 5 | **11** | TBA |
| **7. PRZEWODNIK PRZYSZŁEJ MAMY** *(ZUS)* | Mobile UX / Rules | 4 | 2 | 4 | 4 | 4 | **65 / 35** | 4 | **5** | 5 | 1 | TBA |
| **8. OSINTOWY ŁAPACZ ŚLADÓW** *(MF–KAS)* | Crypto / Graph OSINT | 5 | 4 | **2** | 3 | 4 | 30 / 70 | **5** | 4 | 4 | 5 | TBA |
| **9. PRAWDOWID** *(MSZ)* | NLP Fact-Check | 3 | 4 | **5** | 4 | 4 | 40 / 60 | 4 | 4 | 4 | 3 | TBA |
| **10. ZATRZYMAJ WODĘ, CHROŃ PLONY** *(KOWR)* | GIS / AgriTech | 4 | 4 | **1** | 4 | 4 | 45 / 55 | **5** | 2 | 5 | 0 *(na 14.11)* | TBA |

---

## 3. Pogłębione karty analityczne (wszystkie 10 zadań)

### 1. RISK MINER — Ministerstwo Funduszy i Polityki Regionalnej (`25 000 PLN`)
- **Kto powinien wybrać (a kto unikać):** Idealne dla zespołów Data/Backend/LLM umiejących wydobywać strukturę ze złożonych dokumentów inwestycyjnych (kosztorysy, harmonogramy, kamienie milowe PPP/UE) i łączyć ją z wyjaśnialnym scoringiem (XAI). Unikaj, jeśli Twój zespół nie potrafi wyjść poza prosty czat nad jednym plikiem PDF.
- **Analiza kryteriów:** Wysoka jawna nagroda (`25 000 PLN`) przyciągnie spory tłok (`C4=4`), ale w zadaniu wygrywają detale techniczne i analityczne (`35% UX / 65% Algorytm`). Solo/duo (`C5=4`) ma duże szanse z jednym spójnym dashboardem w Python/FastAPI + React.
- **Co dokładnie oceniają mentorzy:** Na `/mentorzy` są: Dyrektor Dep. PPP (Michał Piwowarczyk), Naczelnik Wydz. Rozwoju i Wdrażania Systemów IT (Paweł Żbikowski) i Kierownik Marcin Bogucki — szukają **praktycznego systemu wczesnego ostrzegania dla kontrolerów i menedżerów projektów**, a nie eksperymentu bez uzasadnienia liczbowego.
- **Killer Feature na Etap 1 i 2:** Interaktywny **graf zależności ryzyk i podwykonawców** połączony z deterministycznym sprawdzeniem odchyleń budżetowo-terminowych oraz panelem XAI: kliknięcie czerwonej flagi otwiera dokładny cytat i stronę z dokumentacji.
- **Błąd eliminujący 80% konkurencji:** Zbudowanie „czarnej skrzynki” lub generycznego RAG-czatu, który halucynuje kwoty i nie wskazuje weryfikowalnej ścieżki źródłowej w dokumentacji.

### 2. ATTACK SURFACE INTELLIGENCE — AGH (`25 000 PLN`)
- **Kto powinien wybrać (a kto unikać):** Złoty strzał dla osób i zespołów z doświadczeniem AppSec / NetSec / Blue Team / Red Team. Unikaj, jeśli nigdy nie pracowałeś z enumeracją aktywów, CVE/EPSS i architekturą sieciową.
- **Analiza kryteriów:** Najwyższa bariera domenowa (`C2=5`) mocno filtruje przypadkowych uczestników (`C4=2`), dając jeden z najlepszych stosunków jakości konkurencji do jawnej nagrody `25 000 PLN`. Bardzo wysoki potencjał wcześniejszego przygotowania (`C12=5`: KEV/EPSS, grafy ataku).
- **Co dokładnie oceniają mentorzy:** Specjalista ds. bezpieczeństwa (Paweł Skalny) oraz inżynier bezpieczeństwa aplikacji (Tomasz Nal) — **techniczni praktycy uczelniani**, których nie oszukasz marketingowymi slajdami; sprawdzą jakość priorytetyzacji i realność ścieżek ataku.
- **Killer Feature na Etap 1 i 2:** **Attack Graph + Drift Detection** pokazujący *choke points* (jak pozornie drobny problem brzegowy otwiera drogę do krytycznego zasobu), priorytetyzowany przez **CISA KEV + EPSS** (zamiast samego CVSS) z generatorem gotowego playbooka mitigacji.
- **Błąd eliminujący 80% konkurencji:** Aktywne skanowanie cudzych zasobów bez autoryzacji (ryzyko regulaminowe!) albo opakowanie samego `nmap` / `nuclei` w prostą tabelkę w Reactcie.

### 3. RADAR INNOWACJI — Podkarpackie Centrum Innowacji (`11 111 PLN`)
- **Kto powinien wybrać (a kto unikać):** Najlepszy wybór dla **graczy solo lub duetów Fullstack/AI** stawiających na bardzo wysoką szansę wejścia do finału TOP 5 przy najniższym ryzyku pułapek prawnych (`C11=1`). Unikaj, jeśli bezwzględnie celujesz wyłącznie w najwyższą pulę `25 000 PLN`.
- **Analiza kryteriów:** Niższa jawna pula (`11 111 PLN`) automatycznie zmniejszy tłok zespołów nastawionych na maksymalne nagrody (`C4=2`), natomiast intuicyjny problem (`C2=2`) czyni zadanie wyjątkowo przyjaznym pod 24-godzinne MVP (`C5=5`).
- **Co dokładnie oceniają mentorzy:** Menadżer ds. Technologii Protolab (Krzysztof Grabka), Łukasz Szubart i Kacper Moczarny — centrum transferu technologii szukające **mechanizmu wyławiania nieoczywistych inicjatyw (szkoły, koła naukowe, małe gminy)** zanim trafią do kosza.
- **Killer Feature na Etap 1 i 2:** Wizualny „Radar” inicjatyw z semantycznym **matchingiem dwóch stron**: mały oddolny projekt (np. ze szkoły lub gminy) zostaje automatycznie oceniony wg dojrzałości TRL/replikowalności i połączony z konkretnym wyzwaniem innego samorządu lub ścieżką prototypowania w ProtoLab.
- **Błąd eliminujący 80% konkurencji:** Zrobienie zwykłej wyszukiwarki/katalogu projektów w stylu „formularz dodaj pomysł + lista kartek” bez silnika oceny potencjału i kojarzenia z odbiorcą.

### 4. KOMPAS KOMPETENCJI — Biuro Dyrektora Generalnego MC *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** Świetne dla builderów produktowych (również solo/duo, `C5=5`), którzy łączą czysty UX (`60%`) z głębokim zrozumieniem **AI Act** i realiów oceny okresowej w służbie cywilnej. Unikaj, jeśli nie lubisz tematów HR/zarządzania lub chcesz budować ciężkie modele ML.
- **Analiza kryteriów:** Niska zależność od zewnętrznych API (`C3=2`), umiarkowany tłok (`C4=3`), ale **krytyczne ryzyko regulacyjne (`C11=5`)**.
- **Co dokładnie oceniają mentorzy:** 5 mentorów bezpośrednio z MC (Naczelnik, 2 Radców, St. specjalista, Referent) + 7 z KPRM (w tym Dyrektor Michał Włochal) — urzędnicy i radcowie prawni znający ustawę o służbie cywilnej i unijny **AI Act**.
- **Killer Feature na Etap 1 i 2:** Workflow przed/w trakcie/po rozmowie okresowej w pełni zgodny z **Human-in-the-Loop**: AI porządkuje dowody realizacji zadań przez pracownika, podpowiada pytania coachingowe i wykrywa potencjalne uprzedzenia (*anti-bias check*) w opisie przełożonego, po czym proponuje plan rozwoju (IPR).
- **Błąd eliminujący 80% konkurencji:** Zaproponowanie automatycznego oceniania lub rankingowania pracownika przez AI — systemy oceny pracowników wpadają w kategorię **High-Risk AI** w AI Act!

### 5. KOLEKCJONER FEJKÓW — NASK PIB *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** Zespoły **3–5-osobowe z mocnym zapleczem ML/Computer Vision**, embeddingami multimodalnymi i automatyzacją OSINT. Solo bardzo trudne ze względu na wieloetapowy pipeline (`C5=2`, `C6=5`).
- **Analiza kryteriów:** Duży potencjał WOW na demo (`C10=5`), wysoka waga algorytmu (`70%`) oraz zależność od danych/kreacji reklamowych (`C3=4`).
- **Co dokładnie oceniają mentorzy:** Najsilniejszy zespół badawczy AI/ML w zestawieniu (7 osób): dr Ewelina Bartuzi-Trokielewicz (**Kierownik Zakładu Analiz Audiowizualnych i Systemów Biometrycznych NASK**) + 6 ekspertów i inżynierów AI/ML — będą weryfikować **prawdziwą jakość detekcji i klastrowania**.
- **Killer Feature na Etap 1 i 2:** **Graf całych kampanii oszustów** zamiast pojedynczych ocen: system łączy zmutowane kreacje (różne teksty, lekkie zmiany kadru, rotujące domeny) przez **perceptual hashing (pHash/PDQ) + CLIP + OCR + łańcuch przekierowań/SSL**, wykrywa wizerunek celebryty/deepfake i pakuje gotowy materiał dowodowy (zrzut + DOM + hash) dla **CERT Polska**.
- **Błąd eliminujący 80% konkurencji:** Zbudowanie prostego klasyfikatora binarnego „wrzuć 1 obrazek -> API GPT mówi czy scam” bez grupowania kampanii i odporności na cloaking/rotację domen.

### 6. CYFRYZACJA FORMULARZY — Centralny Ośrodek Informatyki (`pula TBA`)
- **Kto powinien wybrać (a kto unikać):** Wielodyscyplinarne zespoły **3–6 osób z silnym Designerem UX/UI**, Fullstackiem i inżynierem Document AI. Unikaj, jeśli nie masz w zespole nikogo od dostępności i interfejsów (`55% UX`) — to prawdopodobnie najbardziej oblegana kategoria (`C4=5`).
- **Analiza kryteriów:** Rekordowa liczba mentorów (`11 osób`), wysoki potencjał wcześniejszego przygotowania wzorców formularzy (`C12=5`), gigantyczny potencjał demo WOW (`C10=5`).
- **Co dokładnie oceniają mentorzy:** CAIO COI (Mikołaj Mroszczak), **Dyrektorka Dep. Badań i Projektowania Doświadczeń** (Magda Kołba-Górna), Dyr. Komunikacji Elektronicznej, badaczka UX, projektant UX/UI, ML, Java i PO — **równy nacisk na badania UX/WCAG 2.1 AA i automatyzację AI**.
- **Killer Feature na Etap 1 i 2:** „Rozporządzenie/PDF → Gotowa e-usługa w 30 sekund”: wgrywasz złożony PDF urzędowy, system ekstrahuje **JSON Schema + logikę warunkową**, tłumaczy urzędowy żargon na **Plain Polish**, generuje dostępny (**WCAG 2.1 AA**) kreator krok-po-kroku w estetyce mObywatela/gov.pl i daje urzędnikowi widok zatwierdzania zmian.
- **Błąd eliminujący 80% konkurencji:** Zrobienie topornego formularza z brzydkim UI wygenerowanym 1:1 bez uproszczenia pytań (Plain Polish), obsługi walidacji WCAG i podziału na potrzeby obywatela vs urzędnika.

### 7. PRZEWODNIK PRZYSZŁEJ MAMY — ZUS *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** Zespoły **Product/Mobile UX (`65%`)** potrafiące ułożyć zawiłe przepisy w empatyczną, krystalicznie czystą aplikację na telefon. Unikaj, jeśli chcesz polegać na odpowiedziach samego LLM bez twardego silnika reguł.
- **Analiza kryteriów:** Niska zależność od zewnętrznych API (`C3=2`), wysoka możliwość zmapowania polskich przepisów przed wydarzeniem (`C12=5`: zasiłki, urlopy, 800+, Aktywny Rodzic, ZUS ZCNA), ale **maksymalne ryzyko merytoryczne (`C11=5`)**.
- **Co dokładnie oceniają mentorzy:** Dyrektor w ZUS (Michał Dębiński) — w edycji 2025 zadanie ZUS (*ZANT*) pokazało, że liczy się **bezbłędność proceduralna, brak pomyłek w terminach/wnioskach i łatwość dla zwykłego obywatela**.
- **Killer Feature na Etap 1 i 2:** Krótki onboarding (tydzień ciąży / planowana data porodu, forma zatrudnienia: UoP / B2B / zlecenie / brak, sytuacja drugiego rodzica) → **deterministyczny symulator wariantów świadczeń** (np. 81,5% vs 100%/70% + Aktywny Rodzic) + dynamiczna **oś czasu „Co, gdzie i do kiedy złożyć”** (wraz z przypomnieniami i checklistą).
- **Błąd eliminujący 80% konkurencji:** Oddanie wyliczeń kwot i ustawowych terminów czystemu LLM — jedna halucynacja na live demo dyskwalifikuje projekt w oczach dyrektora ZUS.

### 8. OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW — MF / KAS *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** Analitycy grafowi, fani OSINT i web3/blockchain forensics umiejący łączyć dane on-chain z otwartym internetem. Unikaj bez doświadczenia w analizie grafów transakcyjnych lub OSINT.
- **Analiza kryteriów:** Wysoka bariera wejścia (`C2=5`) trzyma tłumy z daleka (`C4=2`), a grafowy UX + śledztwo na żywo daje maksymalne demo WOW (`C10=5`).
- **Co dokładnie oceniają mentorzy:** 5 dyrektorów i naczelników z **CIRF, Aplikacje Krytyczne MF oraz frontowych urzędów KAS (Bydgoszcz, Katowice)** — dokładnie ci ludzie, którzy na co dzień zwalczają szarą strefę i pranie pieniędzy. Oczekują **narzędzia operacyjnego z wartością dowodową**, a nie zabawki krypto.
- **Killer Feature na Etap 1 i 2:** Połączenie heurystyk grafu on-chain (klasteryzacja adresów, *peeling chains*, mosty cross-chain, miksery/giełdy) z korelacją **off-chain OSINT** (fora, ogłoszenia, domeny, rejestr **RDWW** — Rejestr Działalności w zakresie Walut Wirtualnych) i **jednym kliknięciem do eksportu audytowalnej notatki analitycznej** z dokładnymi `tx_hash`.
- **Błąd eliminujący 80% konkurencji:** Zrobienie zwykłej nakładki na eksplorator blockchain bez powiązania z polskim kontekstem (RDWW / OSINT off-chain) i bez audytowalnego raportu do akt sprawy.

### 9. PRAWDOWID — Ministerstwo Spraw Zagranicznych *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** Zespoły NLP / RAG / Information Retrieval, które potrafią zbudować precyzyjny system weryfikacji faktów i odporności na manipulację. Uwaga: spodziewaj się dużego tłoku (`C4=5`), bo temat dezinformacji przyciąga bardzo wiele drużyn LLM.
- **Analiza kryteriów:** Zrównoważony profil (`40% UX / 60% Algorytm`), wykonalny również w 1–2 osoby (`C5=4`), ale wysoka zależność od zewnętrznego wyszukiwania źródeł pierwotnych (`C3=4`).
- **Co dokładnie oceniają mentorzy:** Radca generalny MSZ (Konrad Gałczyński), Analityk MSZ (Piotr Sosnowski) oraz Ekspertka PISM (Aleksandra Wojtowicz) — szukają **neutralności, cytowania źródeł pierwotnych i dekonstrukcji technik manipulacji**.
- **Killer Feature na Etap 1 i 2:** Rozbijanie artykułu/posta na pojedyncze **atomowe twierdzenia (*atomic claims*)**, wielojęzyczna triangulacja względem źródeł pierwotnych/urzędowych z podaniem dat i linków oraz oznaczenie konkretnych technik manipulacji (*cherry-picking*, wycięty kontekst, fałszywa korelacja) — działające np. jako **wtyczka do przeglądarki + webowa piaskownica**.
- **Błąd eliminujący 80% konkurencji:** Zwracanie arbitralnego wyniku typu „82% kłamstwa” wygenerowanego bez wiarygodnych źródeł pierwotnych lub brak zabezpieczenia przed *prompt injection* w analizowanych tekstach.

### 10. ZATRZYMAJ WODĘ, CHROŃ PLONY — KOWR *(pula TBA)*
- **Kto powinien wybrać (a kto unikać):** **Czarny koń hackathonu** dla każdego, kto umie pracować z mapami (`Leaflet`/`Mapbox`/`Deck.gl`), otwartymi danymi przestrzennymi Polski (Geoportal ULDK, Copernicus Sentinel-2 NDVI/NDWI, IMGW, IUNG) lub chce świadomie wybrać **najmniej zatłoczoną kategorię**.
- **Analiza kryteriów:** Najniższy przewidywany tłok (`C4=1`), najwyższy potencjał przygotowania otwartych warstw GIS przed wydarzeniem (`C12=5`) i bardzo efektowne wizualnie demo na mapie (`C10=5`). Uwaga: na dzień 14.11 KOWR ma `0` przypisanych mentorów na `/mentorzy` — sprawdź aktualizację obsady 21.11 o 11:00.
- **Analiza oczekiwań KOWR:** Przełożenie twardych danych hydrologicznych, glebowych i satelitarnych na **bardzo prosty język korzyści dla rolnika**.
- **Killer Feature na Etap 1 i 2:** Klikasz **dowolną prawdziwą działkę ewidencyjną w Polsce** (po numerze lub na mapie) → system pobiera rzeźbę terenu / wilgotność / zagrożenie suszą → wylicza potencjał retencji mikro-zlewni i proponuje konkretne interwencje (np. zastawki, zadrzewienia śródpolne, zmiana międzyplonów) z oszacowaniem efektu wodnego i wskazaniem programów dopłat.
- **Błąd eliminujący 80% konkurencji:** Stworzenie ciężkiego naukowego dashboardu GIS z dziesiątkami surowych indeksów teledetekcyjnych, z których rolnik nie wie, jaką konkretną decyzję ma podjąć jutro na swoim polu.

---

## 4. Dobór zadania pod Twój profil („Które zadanie najbardziej mi pasuje?”)

| Twój profil / Archetyp | TOP 1 | TOP 2 | Opcja rezerwowa | Kluczowy argument |
|---|---|---|---|---|
| **1. Solo / Duo Fullstack + LLM API** | **RADAR INNOWACJI** *(PCI)* | **KOMPAS KOMPETENCJI** *(MC)* | **RISK MINER** *(MFiPR)* | Niska/średnia bariera danych, spójna aplikacja do dowiezienia przez 1–2 osoby w 24h; w *RADAR* niski tłok, w *MC* pilnuj AI Act. |
| **2. Product-First / UX & Mobile Frontend** | **PRZEWODNIK PRZYSZŁEJ MAMY** *(ZUS)* | **CYFRYZACJA FORMULARZY** *(COI)* | **KOMPAS KOMPETENCJI** *(MC)* | Najwyższy udział jakości UX/UI w ocenie końcowej (pamiętaj o deterministycznym silniku reguł w ZUS i WCAG w COI). |
| **3. Backend / Data / PDF Parsing / RAG & XAI** | **RISK MINER** *(MFiPR)* | **PRAWDOWID** *(MSZ)* | **CYFRYZACJA FORMULARZY** *(COI)* | Jawna pula `25 000 PLN` w *RISK MINER*, wyraźny nacisk na ekstrakcję struktury i wyjaśnialność zamiast efektownego frontendu. |
| **4. Zespół ML / Computer Vision / Multimodal** | **KOLEKCJONER FEJKÓW** *(NASK)* | **PRAWDOWID** *(MSZ)* | **RISK MINER** *(MFiPR)* | Klastrowanie kampanii (pHash, CLIP, OCR, deepfake) pod 7 badaczy AI/ML i biometrii NASK. |
| **5. Cybersec / AppSec / OSINT / Web3** | **ATTACK SURFACE INTELLIGENCE** *(AGH)* | **OSINTOWY ŁAPACZ ŚLADÓW** *(KAS)* | **KOLEKCJONER FEJKÓW** *(NASK)* | Wysoka bariera techniczna skutecznie zmniejsza konkurencję; praktycy z AGH i KAS premiują merytorykę i dowodowość. |
| **6. GIS / Mapy / Teledetekcja / Data** | **ZATRZYMAJ WODĘ, CHROŃ PLONY** *(KOWR)* | **RISK MINER** *(MFiPR)* | **RADAR INNOWACJI** *(PCI)* | Jedyne czyste wyzwanie geoprzestrzenne — łatwe wyróżnienie się realnymi danymi Geoportal/Sentinel/IMGW. |
| **7. Maksymalizacja EV (niski tłok → TOP 5)** | **ZATRZYMAJ WODĘ, CHROŃ PLONY** *(KOWR)* | **ATTACK SURFACE INTELLIGENCE** *(AGH)* | **OSINTOWY ŁAPACZ ŚLADÓW** *(KAS)* | KOWR daje najniższy spodziewany tłok, a AGH łączy małą liczbę specjalistów EASM z jawną pulą `25 000 PLN`. |

### Strategia startu w 2 zadaniach równolegle (zgodnie z regulaminem)
Regulamin dopuszcza udział zespołu w **maksymalnie 2 zadaniach**, ale wymaga ostrożności:
1. **Technikalia HackTribe:** jeden Team Leader zakłada tylko **1 projekt** — drugi projekt musi założyć inny członek zespołu (przy starcie solo: drugie konto z innym adresem e-mail wg tutoriala HackTribe).
2. **Kolizja IP (art. 921 § 3 KC):** organizatorzy **odradzają zgłaszanie dokładnie tego samego projektu do dwóch zadań**, bo wygrana w obu prowadziłaby do kolizji przeniesienia majątkowych praw autorskich na dwóch różnych inicjatorów.
3. **Kiedy warto rozważyć parę o wspólnym rdzeniu (2 osobne wdrożenia / interfejsy)?**
   - *Wariant A (NLP / Scraping / Graf OSINT):* **`PRAWDOWID` (MSZ)** + **`KOLEKCJONER FEJKÓW` (NASK)** *(jeśli brakujący partner nie pokrywa się jeszcze silniej, ale pamiętaj o 2 osobnych produktach i repozytoriach)*.
   - *Wariant B (Document Parsing / JSON Schema):* **`CYFRYZACJA FORMULARZY` (COI)** + **`RISK MINER` (MFiPR)** *(wspólna ekspertyza ekstrakcji danych z urzędowych PDF-ów, ale zupełnie inne produkty końcowe)*.
   - Mimo wszystko dla większości zespołów 1–4 osobowych **skupienie 100% czasu na 1 starannie wybranym zadaniu daje wyższe prawdopodobieństwo wygrania finału niż dzielenie uwagi przed `20:00`**.

---

## 5. Protokół decyzyjny na sobotę 21.11, godz. 11:00–12:00 (ocena 5 brakujących zadań)

W sobotę o **11:00** pojawią się pełne specyfikacje, kryteria z wagami, paczki danych oraz pozostałe zadania z zapowiedzianych **15 wyzwań** (wg listy mentorów silnymi kandydatami są **UKNF** [3 mentorów z CIO], **IBE** [2 ekspertów ds. mikropoświadczeń], **OPI PIB**, **MRiT**, **AKMF/KPRM**). W ciągu pierwszych **45 minut** wykonaj 5 szybkich testów przed ostateczną blokadą wyboru:

1. **Test jawnej puli nagród i wag:** Sprawdź wagi na HackTribe (ile % dostaje Technologia vs UX vs Dopasowanie) i czy pojawiło się zadanie z wyższą pulą lub bardzo niskim tłokiem.
2. **Test „11:00 Dataset Check”:** Jeśli partner dostarczył surowe dane (np. logi, paczka PDF, zrzut transakcji, próbki reklam), otwórz je od razu — czy w 15 minut jesteś w stanie je sparsować i zrozumieć? Jeśli nie, uciekaj w stabilniejsze zadanie.
3. **Test tłoku w Hali nr 1:** Przejdź pod stoiska mentorskie interesujących Cię 2–3 partnerów ok. `11:45–12:30`. Zobaczysz kolejki do mentorów i od razu ocenisz realny tłok w danej kategorii oraz zadasz 2 kluczowe pytania o kryteria oceny.
4. **Test zderzenia z AI Act / prawem:** Sprawdź zapis o IP (czy otwarta licencja czy przeniesienie praw) oraz twarde ograniczenia merytoryczne (determinizm wyliczeń, brak zakazanych automatycznych ocen pracowniczych).
5. **Zamrożenie decyzji najpóźniej o `13:00` i założenie Draftu na HackTribe przed `20:00`** (po `20:00` nie zmienisz już Zadania Partnerskiego!).
