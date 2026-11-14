---
title: Katalog Zadań Partnerskich HackNation 2026 + Rekomendacje Architektoniczne AI
category: challenges_2026
last_verified: 2026-11-14
sources:
  - https://hacknation.pl/zadania
  - https://hacknation.pl/mentorzy
---

# Katalog Wyzwań HackNation 2026

> [!IMPORTANT]
> Na stronie głównej zapowiedziano **15 wyzwań od 15 partnerów**. Na dzień 14.11.2026 w sekcji `/zadania` opublikowano publicznie **10 zadań** (wszystkie w dziale *Zadania Partnerskie*). Pełne specyfikacje techniczne, kryteria punktowe, ewentualne zbiory danych i ewentualne pozostałe 5 zadań pojawią się najpóźniej **w sobotę 21.11.2026 o godz. 11:00**.

---

## Zestawienie opublikowanych wyzwań (10/15)

| # | Kampania / Zadanie | Inicjator | Pula nagród (na karcie) | Główna domena |
|---|---|---|---|---|
| 1 | **RISK MINER** | Ministerstwo Funduszy i Polityki Regionalnej (MFiPR) | **25 000** | Big Data / AI / Ryzyka inwestycji publicznych |
| 2 | **ATTACK SURFACE INTELLIGENCE** | Akademia Górniczo-Hutnicza (AGH) | **25 000** | Cyberbezpieczeństwo / EASM / AppSec |
| 3 | **RADAR INNOWACJI** | Podkarpackie Centrum Innowacji (PCI) | **11 111** | Transfer technologii / B+R / Matching AI |
| 4 | **KOMPAS KOMPETENCJI** | Biuro Dyrektora Generalnego – Ministerstwo Cyfryzacji | *(nieujawniona)* | HR Tech / Służba cywilna / AI Act-safe AI |
| 5 | **KOLEKCJONER FEJKÓW** | NASK – Państwowy Instytut Badawczy | *(nieujawniona)* | Cyberbezpieczeństwo / Anti-Scam / Multimodal AI |
| 6 | **CYFRYZACJA FORMULARZY** | Centralny Ośrodek Informatyki (COI) | *(nieujawniona)* | GovTech / Document-to-E-Service AI / WCAG |
| 7 | **PRZEWODNIK PRZYSZŁEJ MAMY** | Zakład Ubezpieczeń Społecznych (ZUS) | *(nieujawniona)* | GovTech / Świadczenia / Mobile-first UX |
| 8 | **OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW** | Ministerstwo Finansów – KAS | *(nieujawniona)* | Crypto Forensics / OSINT / Analiza grafowa |
| 9 | **PRAWDOWID** | Ministerstwo Spraw Zagranicznych (MSZ) | *(nieujawniona)* | Fact-Checking / NLP / Odporność informacyjna |
| 10 | **ZATRZYMAJ WODĘ, CHROŃ PLONY** | Krajowy Ośrodek Wsparcia Rolnictwa (KOWR) | *(nieujawniona)* | AgriTech / GIS / Teledetekcja / Klimat |

---

## Szczegółowe karty zadań i rekomendacje dla agentów AI

### 1. RISK MINER — MFiPR (Pula: 25 000)
- **Treść ze strony:** *„Każda inwestycja publiczna to wiele decyzji, zależności i potencjalnych zagrożeń. Jak wykorzystać dane, AI i nowoczesne technologie, aby wcześniej identyfikować ryzyka, przewidywać problemy i skuteczniej planować realizację inwestycji?”*
- **Kontekst mentorski:** MFiPR wysyła 3 mentorów, w tym **Dyrektora Dep. PPP** (Michał Piwowarczyk) oraz **Naczelnika Wydziału Rozwoju i Wdrażania Systemów Informatycznych** (Paweł Żbikowski).
- **Rekomendacja architektoniczna MVP:**
  - Pipeline ekstrakcji ustrukturyzowanej z dokumentacji projektowej (budżety, harmonogramy, kamienie milowe, podmioty/wykonawcy, ryzyka PPP/UE).
  - Silnik *Early Warning*: połączenie reguł deterministycznych (odchylenia kosztów, kolizje terminów, koncentracja podwykonawców) z grafem zależności inwestycji oraz wyjaśnialnym scoringiem AI (**XAI** z cytowaniem dokładnej strony/akapitu źródła).

### 2. ATTACK SURFACE INTELLIGENCE — AGH (Pula: 25 000)
- **Treść ze strony:** *„Rozbudowana infrastruktura sieciowa może skrywać wiele niewidocznych zagrożeń, czających się w jej najmniej oczywistych zakamarkach. Każda organizacja powinna znać swoją infrastrukturę równie dobrze, jak generał zna pole bitwy i możliwości swojej armii. Jak rozproszyć mgłę cyfrowej wojny, dostrzec zagrożenia, zanim uderzą, i uniknąć porażki? Jak budować cyfrowe mury obronne, by udaremnić próby ich podkopania, sforsowania czy obejścia?”*
- **Kontekst mentorski:** Z ramienia AGH występują specjalista ds. bezpieczeństwa (Paweł Skalny) oraz **inżynier bezpieczeństwa aplikacji** (Tomasz Nal).
- **Rekomendacja architektoniczna MVP:**
  - Zewnętrzne i wewnętrzne mapowanie powierzchni ataku (EASM): pasywna enumeracja domen/subdomen/certyfikatów/usług (na testowym, własnym środowisku labowym!), korelacja z CVE + **CISA KEV + EPSS** zamiast ślepego CVSS.
  - **Attack Graph + Drift Detection:** Wizualizacja ścieżek ataku (jak mała podatna usługa brzegowa prowadzi do krytycznego zasobu) + wykrywanie nowych zmian w infrastrukturze i asystent AI generujący konkretne kroki hardeningu.

### 3. RADAR INNOWACJI — Podkarpackie Centrum Innowacji (Pula: 11 111)
- **Treść ze strony:** *„W szkołach, uczelniach, samorządach i innych instytucjach publicznych rodzą się pomysły, których znaczenie może wykraczać daleko poza miejsce ich powstania. Część z nich zyskuje rozgłos, inne pozostają w cieniu codziennych działań. Co sprawia, że dostrzegamy ich potencjał? Jak odnaleźć wśród lokalnych inicjatyw te, które mogą stać się początkiem większej zmiany?”*
- **Kontekst mentorski:** Menadżer ds. Technologii **Protolab** w PCI (Krzysztof Grabka) + Łukasz Szubart + Kacper Moczarny.
- **Rekomendacja architektoniczna MVP:**
  - Skaner i repozytorium oddolnych inicjatyw (szkoły, koła naukowe, samorządy, projekty badawcze) z semantycznym wyszukiwaniem i scoringiem potencjału (TRL, skalowalność, gotowość do wdrożenia w innych gminach/biznesie).
  - Silnik kojarzenia (matching) potrzeb samorządów/przemysłu z lokalnymi projektami i prototypowniami (typu ProtoLab).

### 4. KOMPAS KOMPETENCJI — Biuro Dyrektora Generalnego MC
- **Treść ze strony:** *„Dobór odpowiednich kryteriów, rzetelna ocena kompetencji i rozmowa o wynikach pracy to wyzwania, z którymi mierzą się przełożeni w służbie cywilnej. Wśród procedur i formularzy łatwo zgubić najważniejszy cel tego procesu - wsparcie pracownika w dalszym rozwoju. Jak wykorzystać technologię, by ułatwić dokonywanie obiektywnych ocen i stworzyć przestrzeń do rozmowy o osiągnięciach, obszarach do poprawy oraz kolejnych krokach zawodowych?”*
- **Uwaga regulacyjna (AI Act!):** Systemy AI wspierające ocenę pracowników podlegają pod kategorię podwyższonego ryzyka (**High-Risk AI** wg unijnego AI Act). **Zwycięskie podejście musi być ściśle Human-in-the-Loop**: AI pomaga przełożonemu i pracownikowi zebrać dowody realizacji celów, dobrać kryteria i sformułować konstruktywny, wolny od uprzedzeń plan rozwoju — nigdy nie „wystawia oceny za człowieka”.

### 5. KOLEKCJONER FEJKÓW — NASK PIB
- **Treść ze strony:** *„Fałszywe reklamy wykorzystujące wizerunki znanych osób pozorują wiarygodność i prowadzą użytkowników wprost w pułapkę oszustów. Szybko znikają, zmieniają formę i wracają pod nowymi adresami, utrudniając rozpoznanie skali zagrożenia. Pojedynczy podejrzany materiał może być zaledwie fragmentem znacznie większej kampanii. Jak dostrzec szerszy obraz w chaosie internetowych oszustw i skuteczniej chronić ich potencjalne ofiary?”*
- **Kontekst mentorski (bardzo silny zespół NASK!):** Kierownik **Zakładu Analiz Audiowizualnych i Systemów Biometrycznych NASK** (dr Ewelina Bartuzi-Trokielewicz) + 6 ekspertów AI/ML z NASK.
- **Rekomendacja architektoniczna MVP:**
  - Kluczowe słowo to **kampania**, nie pojedyncza reklama. Zbuduj system łączący zgłoszone lub zescrapowane kreacje (np. Meta Ad Library / zgłoszenia obywateli) za pomocą **perceptual hashing (pHash/PDQ)**, **embeddingów CLIP** + **OCR** + **analizy domen/przekierowań** w klastry powiązanych kampanii oszustów.
  - Dodaj wykrywanie wizerunku znanych osób / deepfake audio-video oraz automatyczny eksport pakietu dowodowego (screenshot + DOM + łańcuch redirectów) dla CERT Polska.

### 6. CYFRYZACJA FORMULARZY — Centralny Ośrodek Informatyki (COI)
- **Treść ze strony:** *„Jak sztuczna inteligencja może wspierać rozwój nowoczesnych usług publicznych? Zadaniem uczestników będzie znalezienie rozwiązania, które pomoże usprawnić proces cyfryzacji i sprawić, że droga od potrzeby do wygodnej usługi online będzie prostsza i szybsza.”*
- **Kontekst mentorski (11 mentorów z COI!):** CAIO Mikołaj Mroszczak, **Dyrektorka Dep. Badań i Projektowania Doświadczeń** Magda Kołba-Górna, Dyrektor Dep. Komunikacji Elektronicznej Eliza Fijołek, badaczka UX, projektant UX/UI, inżynierowie ML, Data Scientist i Java dev.
- **Rekomendacja architektoniczna MVP:**
  - Narzędzie „PDF/Rozporządzenie → Gotowa e-usługa”: użytkownik (urzędnik) wgrywa papierowy wzór wniosku lub tekst prawny; system rozbija go na ustrukturyzowany schemat (JSON Schema), wykrywa logikę warunkową, upraszcza pytania do standardu **Plain Polish**, generuje dostępny formularz zgodny z **WCAG 2.1 AA** (wzorowany na mObywatel/gov.pl) oraz daje panel akceptacji dla analityka COI.

### 7. PRZEWODNIK PRZYSZŁEJ MAMY — ZUS
- **Treść ze strony:** *„Narodziny dziecka to początek niezwykłej przygody, ale także czas wielu pytań i formalności. Stwórz aplikację, która pomoże przyszłym i świeżo upieczonym rodzicom odnaleźć się w świecie świadczeń, uprawnień i formalności związanych z ciążą oraz rodzicielstwem. Zaprojektuj rozwiązanie, które zamieni skomplikowane procedury w prostą, intuicyjną i przyjazną ścieżkę.”*
- **Rekomendacja architektoniczna MVP:**
  - **Mobile-first** przewodnik z bardzo prostym kreatorem sytuacji życiowej (tydzień ciąży / data porodu, forma umowy: UoP/B2B/zlecenie/brak, drugi rodzic).
  - **Deterministyczny silnik reguł** (zero halucynacji o kwotach czy terminach!) generujący spersonalizowaną oś czasu (*przed porodem → po porodzie → powrót do pracy*) oraz symulator świadczeń (zasiłek chorobowy, urlop macierzyński/rodzicielski, 800+, Aktywny Rodzic, zgłoszenie ZUS ZCNA) + czat RAG po oficjalnych poradnikach ZUS jako wsparcie pomocnicze.

### 8. OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW — Ministerstwo Finansów (KAS)
- **Treść ze strony:** *„Krypto to nie czarna skrzynka- to dane, algorytmy i fakty. Rozkoduj z nami świat kryptowalut, rozpraw się z popularnymi mitami i wykorzystaj potencjał nowoczesnych technologii. Wesprzyj naszych analityków. Podejmujesz wyzwanie?”*
- **Kontekst mentorski:** Dyrektorzy z Centrum Informatyki Resortu Finansów (CIRF), Kierownik Zespołu Aplikacje Krytyczne MF oraz kierownicy/naczelnicy z frontowych jednostek KAS (Bydgoszcz, Katowice).
- **Rekomendacja architektoniczna MVP:**
  - Platforma dla analityka KAS łącząca **analizę on-chain** (graf transakcji, klasteryzacja adresów, wykrywanie peeling chains, mostów cross-chain, mikserów i powiązań z giełdami) z **OSINT off-chain** (wyszukiwanie adresów portfeli w ogłoszeniach, social mediach, forach, domenach i rejestrze RDWW).
  - Kluczowe dla KAS: przejrzysta **ścieżka dowodowa** (każda krawędź na grafie z konkretnym `tx_hash` i linkiem źródłowym) oraz eksport gotowej notatki analitycznej.

### 9. PRAWDOWID — Ministerstwo Spraw Zagranicznych (MSZ)
- **Treść ze strony:** *„Fakt czy manipulacja? Stwórz narzędzie, które pomoże je rozróżnić. W świecie nadmiaru informacji coraz trudniej ocenić, którym treściom można zaufać. Wykorzystaj sztuczną inteligencję i nowoczesne technologie, aby stworzyć prototyp narzędzia pomagającego użytkownikom weryfikować informacje, docierać do wiarygodnych źródeł i świadomie oceniać napotykane treści.”*
- **Kontekst mentorski:** Radca generalny MSZ, analityk MSZ oraz ekspertka z PISM (Polskiego Instytutu Spraw Międzynarodowych).
- **Rekomendacja architektoniczna MVP:**
  - Narzędzie (web app + opcjonalnie wtyczka przeglądarkowa), które po wklejeniu linku/tekstu/tweeta: (1) wyodrębnia weryfikowalne twierdzenia (*atomic claims*), (2) wyszukuje źródła pierwotne/urzędowe (w tym wielojęzyczne), (3) rozpoznaje techniki manipulacji (wycięty kontekst, fałszywa korelacja, emocjonalny framing) i pokazuje użytkownikowi dowody zamiast nieprzejrzystego wyniku „Prawda/Fałsz”.

### 10. ZATRZYMAJ WODĘ, CHROŃ PLONY — KOWR
- **Treść ze strony:** *„Zmiany klimatu stawiają przed polskim rolnictwem coraz większe wyzwania. Podejmij wyzwanie i zaprojektuj rozwiązanie, które pomoże rolnikom podejmować trafniejsze decyzje, chronić plony i budować bardziej odporne na zmiany klimatu gospodarstwa.”*
- **Rekomendacja architektoniczna MVP:**
  - Interaktywna mapa GIS dla Polski (np. integracja otwartych warstw Geoportal/ULDK działki, Copernicus Sentinel NDVI/NDWI, dane IMGW/IUNG o suszy).
  - Po wskazaniu pola/działki rolnik dostaje prostą ocenę ryzyka wodnego i dopasowane rekomendacje małej retencji (zastawki, oczka, zadrzewienia śródpolne, zmiana struktury upraw) wraz ze wskazaniem programów dopłat/wsparcia.

---

## Sygnały o potencjalnych pozostałych 5 wyzwaniach (do ujawnienia przed/do 21.11 11:00)

Na liście mentorów (`/mentorzy`) oraz w sekcji partnerów figurują instytucje wysokiego szczebla, które nie mają jeszcze opublikowanego zadania w pierwszej dziesiątce na `/zadania`:
1. **Urząd Komisji Nadzoru Finansowego (UKNF)** — aż 3 mentorów, w tym CIO (Sławomir Flis) oraz Z-ca Dyrektora Dep. Informatyki (Dariusz Kobusiński). Silny sygnał możliwego wyzwania FinTech / Cyber / RegTech / Anti-Scam!
2. **Instytut Badań Edukacyjnych (IBE)** — 2 ekspertów, w tym Ekspert ds. Mikropoświadczeń (Marek Mieńkowski). Sygnał możliwego wyzwania EdTech / ZSK / mikropoświadczenia!
3. **Ośrodek Przetwarzania Informacji – PIB (OPI PIB)** — wymieniony na stronie jako Partner Społecznościowy oraz w komunikatach własnych jako jeden z 15 partnerów wyzwań.
4. **KPRM / MRiT / AKMF** — liczni mentorzy (7 osób z KPRM, po 1 z MRiT i AKMF).
