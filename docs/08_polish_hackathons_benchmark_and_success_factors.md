---
doc_id: polish_hackathons_benchmark_and_success_factors
title: "Benchmark polskich hackathonów i 10 empirycznych czynników sukcesu (PROIDEA / HackTribe / GovTech)"
edition: "2024-2026 benchmark pod HackNation 2026"
source_json: "../data/challenges_decision_matrix.json"
status: "verified_against_sources"
language: "pl"
audience: ["participants", "ai_agents"]
---

# Polskie hackathony porównywalne z HackNation — benchmark i czynniki sukcesu

Analiza innych polskich hackathonów technologicznych (zwłaszcza z udziałem administracji publicznej oraz organizowanych przez **PROIDEA sp. z o.o.** na platformie **HackTribe**) ujawnia wyraźną ciągłość organizacyjną, tematyczną i ewaluacyjną. Te same instytucje powracają z kolejnymi iteracjami bardzo podobnych problemów, a te same zespoły studenckie i uczestnicy indywidualni wygrywają powtarzalnie dzięki sprawdzonemu procesowi.

---

## 1. Mapa pokrewnych polskich hackathonów i ich związek z HackNation 2026

### 1.1. HackYeah (2024, 2025, 2026 — Tauron Arena Kraków)
- **Skala:** Największy stacjonarny hackathon w Europie (`2024`: >2600 uczestników, >400 projektów, 12 wyzwań; `2025`: blisko 3000 uczestników, >400 projektów, 10 głównych kategorii; `2026`: 12. edycja).
- **Kluczowa zbieżność operacyjna:** Operatorem wykonawczym HackYeah jest **PROIDEA**, a platformą zgłoszeń i oceniania — **HackTribe** — dokładnie ten sam duet wykonawczo-technologiczny co na **HackNation 2026**.
- **Standardowy profil wag na HackYeah / HackTribe:**
  - *Idea & Innovation (Pomysł i innowacyjność)* — **~30%**
  - *Relation to Category / Challenge (Zgodność z wyzwaniem)* — **~20%**
  - *Practical Applicability / Usability (Użyteczność i potencjał wdrożenia)* — **~20%**
  - *Design / User Experience (Wygląd i interfejs)* — **~20%**
  - *Completeness & Implementation Value (Działający prototyp)* — **~10%**
  *(Uwaga dla HackNation 2026: dokładne wagi poszczególnych zadań zostaną podane o 11:00 w sobotę 21.11, a punktacja Etapu 1 służy wyłącznie do wyłonienia TOP 5 — w finale punkty nie przechodzą dalej).*
- **Co mówią zwycięstwa na HackYeah?**
  - **Wygrana SOLO przy gigantycznym tłoku:** Na HackYeah 2026 w najbardziej oblężonej kategorii *Smart City* (>130 zgłoszonych projektów) 1. miejsce zajął startujący indywidualnie student WSIiZ **Dmytrii Zherebtsov** (autonomiczny system optymalizacji tras i koordynacji dronów ratowniczych). Potwierdza to obserwację z HackNation 2025 (2 wygrane solo: *Adrian Michalski* i *Dominik `kozlowski_d`*): **jedna osoba z ostro zawężonym zakresem i działającym demo potrafi pokonać dziesiątki 5–6-osobowych drużyn.**
  - **Powtarzalność kół naukowych:** Koło **Solvro (PWr)** wygrało wyzwanie bezpiecznego wdrażania AI (Goldman Sachs) na HackYeah 2026 (ekosystem proxy chroniący poufne dane), **SKN Data Science (Politechnika Śląska)** wygrywało zarówno w *Quantum AI* (2024), jak i w *Biohackingu* (2025), a **HexaTeam (WSIiZ)** triumfował seryjnie w *Gamedev* (2024 i 2025).

### 1.2. Supervision_hack (Urząd Komisji Nadzoru Finansowego – UKNF)
- **Profil:** Cykl hackathonów nadzorczych UKNF nastawiony na wykrywanie zagrożeń na rynku finansowym i w sieci; zwycięskie rozwiązania są często wdrażane w nadzorze.
- **Zwycięskie kategorie i projekty (m.in. II edycja):**
  - `#FakeJobHunter`: *Bobby Tables* (*Scam Hunter*), *Data Science Club PJATK* (*Whistleblower on Web-scams*), *Fake Job Finders* (*Fake Job Finder*).
  - `#AdsDetect`: *GigaMiNIony* (*GigaAdsDetector*), *TheFlowersAI* (*FakeBuster*), *StackOvergrows* (*AdsFinder*).
- **Związek z HackNation 2026:** Kategoria `#AdsDetect` (automatyczne wykrywanie fałszywych reklam w internecie) jest bezpośrednim pierwowzorem zadania NASK **`KOLEKCJONER FEJKÓW`**, a obecność **3 mentorów wyższego szczebla z UKNF** na `/mentorzy` (CIO Sławomir Flis, Z-ca Dyr. Dep. Informatyki Dariusz Kobusiński, Ekspert Mateusz Świętochowski) wskazuje na duże prawdopodobieństwo zadania RegTech/Anti-Scam wśród 5 wyzwań do ujawnienia.

### 1.3. Wyzwania Ministerstwa Finansów i KAS na HackYeah
- **Profil:** Analityka finansowo-podatkowa i cyfryzacja procesów skarbowych wystawiana przez MF i KAS na imprezach PROIDEA:
  - *„Follow the river to reach the sea”* (1. *cvtservices*, 2. *CodeVillains*),
  - *„Digital Tax”* (1. *BRAD-PIT-37*, 2. *TaxRobot*, 3. *SKAN Konwerter*).
- **Związek z HackNation 2026:** Widać tu bezpośrednią linię tematyczną do **`OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW`** (śledzenie przepływów dla KAS) oraz automatyzacji dokumentów/formularzy (**`CYFRYZACJA FORMULARZY`** w COI, **`PRZEWODNIK PRZYSZŁEJ MAMY`** w ZUS).

### 1.4. DISINFOHACK (NASK PIB + Ministerstwo Cyfryzacji)
- **Profil:** Konkurs akademicki wykrywania i szczegółowej analizy zorganizowanych kampanii dezinformacyjnych w polskiej infosferze w social media.
- **Związek z HackNation 2026:** Bezpośrednie zaplecze koncepcyjne pod dwa zadania 2026: **`PRAWDOWID`** (MSZ — weryfikacja treści i źródeł pierwotnych) oraz **`KOLEKCJONER FEJKÓW`** (NASK — łączenie pojedynczych reklam w zorganizowane kampanie).

### 1.5. Datathon #OtwarteDane (KPRM / Ministerstwo Finansów / GUS / NASK)
- **Profil:** Przetwarzanie publicznych baz i API na użyteczne narzędzia decyzyjne (np. w kategorii API MF TREZOR 3.0 wygrała drużyna *Data Drivers* [Mateusz Jakubczak, Krzysztof Olipra, Karol Oleszek] z interaktywnym dashboardem wspierającym alokację pomocy).
- **Związek z HackNation 2026:** Pokazuje, że w zadaniach opartych o dane publiczne (**`RISK MINER` MFiPR**, **`ZATRZYMAJ WODĘ, CHROŃ PLONY` KOWR**) wygrywa **przełożenie surowych danych i API na interaktywny panel decyzji**, nie zaś same wykresy eksploracyjne.

### 1.6. CuValley Hack (KGHM) & zadania inżynieryjne HackNation 2025 (JSW, CPK, KAS RTG)
- **Profil:** Przemysłowe i techniczne wyzwania Big Data/AI/CV (KGHM CuValley Hack, a na HackNation 2025: *MEWA* dla KAS RTG, *CombAIns* PW dla JSW IT Systems, *HackStorm / D.R.W.A.L.* dla CPK LiDAR/BIM).
- **Związek z HackNation 2026:** Dowód na to, że w kategoriach analitycznych i cyberbezpieczeństwa (**`ATTACK SURFACE INTELLIGENCE` AGH**, **`KOLEKCJONER FEJKÓW` NASK**, **`OSINTOWY ŁAPACZ ŚLADÓW` KAS**) jurorzy techniczni wymagają **twardych metryk, niskiego wskaźnika fałszywych alarmów (low FPR) i audytowalności**.

---

## 2. Tabela genealogiczna: Poprzednie polskie wyzwania → HackNation 2026

| Wcześniejszy polski hackathon / zadanie | Zadanie HackNation 2026 | Wspólny wzorzec zwycięzców |
|---|---|---|
| **UKNF `Supervision_hack` (`#AdsDetect`)** + **NASK `DISINFOHACK`** | **`KOLEKCJONER FEJKÓW`** *(NASK)* | Nie klasyfikuj 1 obrazka w izolacji — buduj graf kampanii, zachowuj dowody (zrzut + DOM + łańcuch przekierowań) zanim znikną. |
| **MF/KAS `Follow the river...`** (HackYeah) + **MF/KAS `MEWA`** (HackNation 2025) | **`OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW`** *(MF–KAS)* | Łączenie przepływów z kontekstem off-chain/rejestrami, bardzo niski FPR, raport gotowy do akt śledztwa (`tx_hash`). |
| **NASK `DISINFOHACK`** + **MSZ `AIDA`** (HackNation 2025) | **`PRAWDOWID`** *(MSZ)* | Triangulacja w źródłach pierwotnych i dekonstrukcja manipulacji zamiast arbitralnego „AI truth score”. |
| **MF/KAS `Digital Tax`** (HackYeah) + **COI `mZaufanaStrona`** / **ZUS `ZANT`** (HackNation 2025) | **`CYFRYZACJA FORMULARZY`** *(COI)* & **`PRZEWODNIK PRZYSZŁEJ MAMY`** *(ZUS)* | Ekstremalna czytelność UI dla obywatela, zgodność z ekosystemem gov/mObywatel i zero błędów proceduralnych. |
| **Datathon `#OtwarteDane`** (API MF TREZOR 3.0) + **PKO BP `Industrial Risk Monitor`** (HackNation 2025) | **`RISK MINER`** *(MFiPR)* & **`ZATRZYMAJ WODĘ...`** *(KOWR)* | Przekucie rozproszonych danych/PDF/GIS w prosty system wczesnego ostrzegania i rekomendacji (XAI / praktyczne działanie). |
| **Goldman Sachs AI Proxy (`Solvro`, HackYeah 2026)** | **`KOMPAS KOMPETENCJI`** *(MC)* & **`ATTACK SURFACE INTELLIGENCE`** *(AGH)* | Architektura „security & compliance by design” (AI Act Human-in-the-Loop dla MC; pasywna/Kev/EPSS analiza dla AGH). |

---

## 3. 10 empirycznych czynników sukcesu na polskich hackathonach (PROIDEA / HackTribe / GovTech)

Na podstawie analizy wygranych z **HackNation 2025**, **HackYeah 2024–2026**, **Supervision_hack** oraz procedury **HackTribe**:

1. **Optymalizacja pod lejek HackTribe (Etap 1 ≠ Etap 2):**
   - W **Etapie 1** (niedziela `11:00–14:45`) jurorzy oceniają dziesiątki zgłoszeń w kilka minut na podstawie **PDF ≤ 10 MB**, opisu po angielsku/polsku oraz **wideo demo ≤ 2 min**. Brak wideo lub chaotyczny PDF potrafi wyeliminować zespół nawet z dobrym kodem.
   - W **Etapie 2** (finał **TOP 5** od `15:15`) **punkty z Etapu 1 się zerują** — prezentacja na żywo + Q&A decydują o całości nagrody (głosowanie zwykłą większością).
2. **Wyraźna koncentracja na 1 „Core Feature” zamiast półproduktu z 5 zakładkami:**
   - W 24 godziny (od `11:00` w sobotę do `11:00` w niedzielę) wygrywa **jedna działająca od początku do końca ścieżka** (end-to-end), np. wgranie 1 urzędowego PDF → uzyskanie gotowego formularza WCAG w 30 s (*COI*), lub kliknięcie 1 działki na mapie → plan retencji (*KOWR*).
3. **Przełamanie „klątwy generycznego czatbota LLM”:**
   - W polskich zadaniach GovTech po 2024 r. jury jest uodpornione na proste wrappery API LLM. Wygrana wymaga **warstwy inżyniersko-analitycznej ponad modelem**: deterministycznego silnika reguł (*ZUS*, *MFiPR*), grafu powiązań (*KAS*, *AGH*, *NASK*) lub weryfikowalnego cytowania źródeł (*MSZ*).
4. **Wykorzystanie luki podażowej (wybór kategorii o mniejszym tłoku):**
   - W dużych hackathonach (HackYeah `Smart City` >130 projektów; podobne obłożenie mają zadania webowe/czatbotowe na HackNation) do finału wchodzi **zawsze TOP 5 z zadania**. Wybór kategorii o wyższej barierze domenowej (np. GIS *KOWR*, AppSec *AGH*, krypto-OSINT *KAS*) potrafi zwiększyć statystyczną szansę na TOP 5 kilkukrotnie.
5. **Niski odsetek False Positives i „audytowalność dowodu”:**
   - Zespół **MEWA** (zwycięzca MF/KAS RTG 2025) wskazał minimalizację fałszywych alarmów jako klucz do wygranej. W administracji i cyberbezpieczeństwie analityk woli 5 wiarygodnych alertów z dokładnym śladem (`tx_hash`, strona PDF, łańcuch redirectów) niż 50 niepewnych trafień.
6. **Wcześniejsze „wywiadowcze” ustawienie rozwiązań pod skład mentorów:**
   - Zanim zamrozisz architekturę o `12:30` w sobotę, sprawdź kim są mentorzy tego partnera (np. w **COI** przyjeżdża dyrekcja UX Research — więc niedopracowany UI zabija projekt; w **NASK** siedzi 7 badaczy biometrii i AI — więc nie wygrasz samym promptem GPT; w **MFiPR** i **MC** siedzą dyrektorzy i radcy prawni — więc musisz mieć XAI i AI Act compliance).
7. **Aktywne „zderzanie” prototypu z mentorami w Hali nr 1:**
   - Na hackathonach PROIDEA mentorzy partnera często później zasiadają w jury lub rekomendują rozwiązania. Krótka 10-minutowa konsultacja między `13:00` a `18:00` w sobotę pozwala wyeliminować błędne założenie domenowe zanim stracisz noc na zły kierunek (pamiętaj: na HackNation zakładka `1:1 Sessions` w HackTribe jest nieaktywna — umawiaj się na Discordzie lub podejdź do Hali nr 1).
8. **Nazwa produktu i „wizualna pamięć” u jury:**
   - Zwycięzcy HackNation 2025 bardzo często mieli krótką, zapadającą w pamięć nazwę systemu widoczną na pierwszym slajdzie (`mZaufanaStrona`, `D.R.W.A.L.`, `AIDA`, `MEWA`, `052 Quest`, `Industrial Risk Monitor`), tak samo jak laureaci `Supervision_hack` (`Scam Hunter`, `FakeBuster`) czy `Digital Tax` (`BRAD-PIT-37`).
9. **Higiena przygotowania przed startem i praca w „trybie koła naukowego”:**
   - Koła takie jak **KN Solvro (PWr)**, **PWr White Hats** czy **SKN Data Science (PŚ)** wygrywają seryjnie dzięki gotowym szablonom projektowym (auth, FastAPI/Next.js boilerplate, skrypty nagrywania demo) oraz podziałowi ról od 1. godziny (1 osoba odpowiedzialna od startu za logikę danych/AI, 1 za UI/UX, 1 za narrację, slajdy PDF i wideo). *(Pamiętaj tylko o zasadzie z FAQ: wszystko przygotowane przed hackathonem należy uczciwie wskazać w prezentacji).*
10. **Dyscyplina snu i bufor czasowy od 09:00 w niedzielę:**
    - Najczęstszy powód porażek na 24h hackathonach to rozpoczęcie nagrywania demo i składania PDF o `10:35` przed deadlinem `11:00` przez zmęczony zespół. Zamroź nowe funkcje o **`08:30–09:00` w niedzielę**, przeznacz `1,5` godziny na stabilne wideo demo, slajdy PDF (≤ 10 MB) i bezbłędny upload w HackTribe — i zadbaj o 3–4 godziny snu przed popołudniowym pitchingiem o `15:15`.
