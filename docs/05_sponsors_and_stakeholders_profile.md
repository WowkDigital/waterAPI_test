---
doc_id: sponsors_and_stakeholders_profile
title: "HackNation 2026 — Profil sponsorów, partnerów zadań, mentorów i interesariuszy"
edition: "2026 (z odniesieniem do 2025)"
source_json: "../data/sponsors_profiles.json"
status: "verified_against_sources"
language: "pl"
audience: ["participants", "ai_agents"]
---

# HackNation 2026 — Profil sponsorów, partnerów zadań i ekosystemu instytucjonalnego

Charakterystyka sponsorów i partnerów HackNation zasadniczo odróżnia to wydarzenie od komercyjnych hackathonów korporacyjnych. **Profil sponsorów jest w całości zdominowany przez sektor publiczny, administrację centralną, instytuty badawcze PIB oraz uczelnie wyższe (GovTech).** Zamiast rekrutacyjnych zadań typowych dla firm prywatnych, inicjatorami wyzwań są ministerstwa, służby skarbowo-celne, instytucje ubezpieczeniowe, ośrodki badawcze oraz agencje wykonawcze poszukujące rozwiązań o realnym potencjale wdrożeniowym w administracji (co znajduje odzwierciedlenie w regulaminowym przejęciu praw majątkowych do zwycięskich prac w trybie art. 921 § 3 KC).

---

## 1. Organizatorzy główni i współorganizatorzy

| Podmiot | Rola | Powiązanie zadaniowe 2025 -> 2026 | Na co zwraca uwagę jury / priorytety |
|---|---|---|---|
| **Ministerstwo Cyfryzacji (MC) & Departament GovTech Polska** | Organizator główny i zamawiający publiczny (`hacknation@cyfra.gov.pl`, NIP `525-29-55-037`) | **2025:** *Odnalezione zguby*, *Ścieżka prawa* (z GRAI), *Zgrany budżet*<br>**2026:** *KOMPAS KOMPETENCJI* (Biuro Dyrektora Generalnego MC) | Bezpieczne i etyczne AI w sektorze publicznym (AI Act, human-in-the-loop, RODO, WCAG 2.1 AA), gotowość pilotażu/wdrożenia w urzędach. Wsparcie merytoryczne: 5 mentorów bezpośrednio z MC + 7 z KPRM. |
| **Miasto Bydgoszcz** | Współorganizator i Gospodarz wydarzenia (BCTW) | **2025:** *Bydgoszcz – Ścieżki Pamięci 2.0*<br>**2026:** współorganizacja lokalna (brak osobnego zadania opublikowanego na dzień 14.11) | Budowa ekosystemu IT/GovTech w regionie (Bydgoski Klaster Informatyczny), użyteczność dla mieszkańców i smart city. |
| **PROIDEA sp. z o.o.** | Operator wykonawczy i współadministrator danych osobowych | Prowadzenie logistyki, biura organizacyjnego, transportu, komunikacji z uczestnikami i mentorami | Sprawna realizacja 24-godzinnego sprintu i dyscyplina terminów na HackTribe (Draft 20:00 / Final 11:00). |

---

## 2. Profil 9 partnerów zadań (sekcja logo) + Biuro Dyrektora Generalnego MC

Na dzień 14.11.2026 r. na stronie głównej zaprezentowano **9 logotypów Partnerów Zadań**, a na `/zadania` opublikowano **10 wyzwań** (ponieważ wyzwanie *KOMPAS KOMPETENCJI* wystawia wewnętrznie Biuro Dyrektora Generalnego MC).

### 2.1. Ministerstwo Finansów – Krajowa Administracja Skarbowa (MF – KAS) & CIRF
- **Typ instytucji:** Administracja skarbowa, celno-skarbowa i zaplecze IT resortu finansów (Centrum Informatyki Resortu Finansów / Aplikacje Krytyczne).
- **Ciągłość edycyjna:** **2025** (*Wyszukiwarka anomalii* – RTG/YOLO, *Kontrola zakładów wzajemnych*) -> **2026** (*OSINTOWY ŁAPACZ CYFROWYCH ŚLADÓW*).
- **Ławka mentorska (5 osób):** Paweł Roszkowski (Dyrektor Dep. w MF/CIRF), Szymon Marciniak (Z-ca Dyr. Dep. w CIRF), Adam Graliński (Kierownik Zespołu w Aplikacje Krytyczne MF), Maciej Kastner (Z-ca Naczelnika US w IAS Bydgoszcz), Andrzej Szczotka (Kierownik Referatu Rejestrów Działalności Regulowanej KAS Katowice).
- **Profil oczekiwań:** Analityka grafowa i OSINT pod realne śledztwa skarbowe/AML/krypto (korelacja on-chain + off-chain + rejestr RDWW), niski odsetek fałszywych alarmów, pełna audytowalność każdego ustalenia (dowód: `tx_hash`, timestamp, źródło OSINT) gotowa do akt sprawy.

### 2.2. Centralny Ośrodek Informatyki (COI)
- **Typ instytucji:** Państwowy dostawca kluczowych rejestrów i e-usług (mObywatel, PESEL, CEPiK, gov.pl), podległy MC.
- **Ciągłość edycyjna:** **2025** (*Prawda w sieci* -> `mZaufanaStrona`) -> **2026** (*CYFRYZACJA FORMULARZY*).
- **Najliczniejsza ławka mentorska (11 osób):** Mikołaj Mroszczak (CAIO), Magda Kołba-Górna (Dyrektorka Dep. Badań i Projektowania Doświadczeń), Eliza Fijołek (Dyrektor Dep. Komunikacji Elektronicznej), Emilian Duda (Kierownik Zespołu Usług Cyfrowych), Piotr Laskosz (UX/UI), Stella Chwedoruk (Badaczka UX), Jędrzej Szpygiel (Senior Data Scientist), Bartosz Krajewski (ML Engineer), Tomasz Łuczak (Java), Marek Fabiński i Dawid Czaja (Automatyzacja), Krzysztof Wysocki (PO).
- **Profil oczekiwań:** Silna obecność dyrekcji UX Research i CAIO sygnalizuje równe wagi między inżynierią AI (ekstrakcja reguł/formularzy z PDF) a dostępnością WCAG 2.1 AA, prostym językiem (*Plain Polish*) i designem zbliżonym do standardów mObywatela/gov.pl.

### 2.3. NASK – Państwowy Instytut Badawczy (NASK PIB)
- **Typ instytucji:** Państwowy Instytut Badawczy odpowiadający za cyberbezpieczeństwo (CERT Polska, Dyżurnet) oraz badania AI/biometrię.
- **Ciągłość edycyjna:** **2025** (*Dane bez twarzy* – PET/anonimizacja) -> **2026** (*KOLEKCJONER FEJKÓW*).
- **Ławka mentorska (7 osób):** Ewelina Bartuzi-Trokielewicz (Kierownik Zakładu Analiz Audiowizualnych i Systemów Biometrycznych NASK PIB) oraz 6 specjalistów AI/ML (Donat Stankiewicz, Katarzyna Roszczewska, Alicja Martinek, Dominik Brach, Adrian Kordas, Ada Sawilska).
- **Profil oczekiwań:** Rzetelne podstawy ML/CV/audiowizualne (klastrowanie kampanii oszustw, perceptual hashing, embeddingi wizualne, odporność na rotację domen i cloaking) oraz gromadzenie materiału dowodowego pod procesy blokowania/takedown w CERT Polska.

### 2.4. Ministerstwo Spraw Zagranicznych (MSZ) (+ wsparcie PISM)
- **Typ instytucji:** Resort dyplomacji + eksperci think-tanku PISM.
- **Ciągłość edycyjna:** **2025** (*Scenariusze jutra* -> `AIDA`) -> **2026** (*PRAWDOWID*).
- **Ławka mentorska (3 osoby):** Konrad Gałczyński (Radca generalny w MSZ), Piotr Sosnowski (Analityk w MSZ), Aleksandra Wojtowicz (Ekspertka w PISM).
- **Profil oczekiwań:** Odporność informacyjna i przeciwdziałanie dezinformacji w oparciu o transparentną dekonstrukcję twierdzeń, cytowanie źródeł pierwotnych oraz identyfikację technik manipulacji (bez arbitralnych ocen AI bez dowodu).

### 2.5. Ministerstwo Funduszy i Polityki Regionalnej (MFiPR)
- **Typ instytucji:** Ministerstwo zarządzające funduszami europejskimi i partnerstwem publiczno-prywatnym (PPP).
- **Zadanie 2026:** *RISK MINER* (**Pula nagród: 25 000 PLN**).
- **Ławka mentorska (3 osoby):** Michał Piwowarczyk (Dyrektor Dep. PPP), Paweł Żbikowski (Naczelnik Wydziału Rozwoju i Wdrażania Systemów Informatycznych), Marcin Bogucki (Kierownik w MFiPR).
- **Profil oczekiwań:** Wczesne wykrywanie *red flags* kosztowych, harmonogramowych i proceduralnych w złożonej dokumentacji inwestycyjnej z naciskiem na pełną wyjaśnialność scoringu (XAI) i wskazanie dokładnego źródła w dokumentach.

### 2.6. Akademia Górniczo-Hutnicza w Krakowie (AGH)
- **Typ instytucji:** Czołowa uczelnia techniczno-badawcza w obszarze cyberbezpieczeństwa i IT.
- **Zadanie 2026:** *ATTACK SURFACE INTELLIGENCE* (**Pula nagród: 25 000 PLN**).
- **Ławka mentorska (2 osoby):** Paweł Skalny (Specjalista ds. bezpieczeństwa w AGH), Tomasz Nal (Inżynier bezpieczeństwa aplikacji w AGH).
- **Profil oczekiwań:** Techniczna głębia EASM/AppSec/NetSec w dużych, heterogenicznych sieciach (pasywna enumeracja, grafy ścieżek ataku, priorytetyzacja pod KEV/EPSS, detekcja zmian ekspozycji w czasie), brak prostych nakładek na pojedyncze skanery.

### 2.7. Zakład Ubezpieczeń Społecznych (ZUS)
- **Typ instytucji:** Instytucja zabezpieczenia społecznego (e-ZUS / PUE ZUS).
- **Ciągłość edycyjna:** **2025** (*ZUS Accident Notification Tool* / `ZANT`) -> **2026** (*PRZEWODNIK PRZYSZŁEJ MAMY*).
- **Ławka mentorska (1 osoba):** Michał Dębiński (Dyrektor w ZUS).
- **Profil oczekiwań:** Mobile-first UX, wysoka empatia i prostota komunikacji dla rodzica przy zachowaniu 100% deterministycznej poprawności wyliczeń prawnych i terminów (kalkulator regułowy zamiast halucynacji LLM) oraz ochrony danych wrażliwych.

### 2.8. Krajowy Ośrodek Wsparcia Rolnictwa (KOWR)
- **Typ instytucji:** Agencja wykonawcza nadzorująca rynek rolny i Zasób Własności Rolnej Skarbu Państwa.
- **Zadanie 2026:** *ZATRZYMAJ WODĘ, CHROŃ PLONY*.
- **Ławka mentorska:** brak mentorów przypisanych imiennie na `/mentorzy` na dzień 14.11.2026.
- **Profil oczekiwań:** Przełożenie otwartych danych przestrzennych/GIS, satelitarnych i hydrologiczno-klimatycznych (dla konkretnych działek rolnych) na proste, praktyczne rekomendacje retencji i ochrony plonów zrozumiałe dla rolnika.

### 2.9. Podkarpackie Centrum Innowacji (PCI)
- **Typ instytucji:** Regionalny hub transferu technologii, prototypowania (`ProtoLab`) i wsparcia B+R.
- **Zadanie 2026:** *RADAR INNOWACJI* (**Pula nagród: 11 111 PLN**).
- **Ławka mentorska (3 osoby):** Krzysztof Grabka (Menadżer ds. Technologii Protolab), Łukasz Szubart (Ekspert w PCI), Kacper Moczarny (Starszy Specjalista ds. organizacji wydarzeń w PCI).
- **Profil oczekiwań:** Praktyczne wyławianie i ocena potencjału (TRL, replikowalność, zapotrzebowanie samorządowo-rynkowe) oddolnych projektów ze szkół, uczelni i samorządów wraz z mechanizmem matchingu do wsparcia.

### 2.10. Biuro Dyrektora Generalnego – Ministerstwo Cyfryzacji (zadanie wewnętrzne MC)
- **Zadanie 2026:** *KOMPAS KOMPETENCJI*.
- **Ławka mentorska (5 osób z MC + 7 z KPRM):** Iwona Szelenbaum (Naczelnik wydziału), Karolina Kościerzyńska i Magdalena Dąbrowska (Radcy), Karol Teodorowicz (Starszy specjalista), Arkadiusz Maliński (Referent) oraz silna reprezentacja KPRM (m.in. Dyrektor Michał Włochal, radcy i naczelnicy).
- **Profil oczekiwań:** Ścisła zgodność z AI Act (*Human-in-the-Loop*, zakaz w pełni zautomatyzowanych decyzji kadrowych w miejscu pracy), RODO i realiami służby cywilnej.

---

## 3. Sygnały nieujawnionych jeszcze zadań (5 brakujących wyzwań z 15 zapowiedzianych)

Strona główna zapowiada **15 wyzwań od 15 partnerów**, podczas gdy na `/zadania` opublikowano 10 zadań. Analiza 105 profili na `/mentorzy` oraz sekcji partnerów wskazuje najbardziej prawdopodobnych kolejnych inicjatorów, którzy mogą ujawnić swoje zadania do **21.11.2026 godz. 11:00**:

1. **Urząd Komisji Nadzoru Finansowego (UKNF)** — 3 mentorów wysokiego szczebla na `/mentorzy`: CIO Sławomir Flis, Z-ca Dyr. Dep. Informatyki Dariusz Kobusiński oraz Ekspert Mateusz Świętochowski (bardzo silny sygnał zadania z obszaru FinTech / nadzoru finansowego / cyberbezpieczeństwa sektora bankowego).
2. **Instytut Badań Edukacyjnych (IBE)** — 2 ekspertów na `/mentorzy`: Marek Mieńkowski (Ekspert ds. Mikropoświadczeń) oraz Ziemowit Socha (Ekspert IBE) — silny sygnał zadania z obszaru EdTech / kwalifikacji i mikropoświadczeń (*microcredentials*).
3. **Ośrodek Przetwarzania Informacji – PIB (OPI PIB)** — wymieniony wśród Partnerów Społecznościowych oraz zapowiadający udział w HackNation 2026.
4. **Ministerstwo Rozwoju i Technologii (MRiT)** (1 mentor: Anna Broniarek) oraz **AKMF** (1 mentor: Dyrektor Maciej Morawski) / **KPRM** (7 mentorów — część wspiera zadania administracyjne i cyfryzację służby cywilnej).

> [!TIP]
> Partnerzy z edycji **2025**, których na dzień 14.11 nie ma wśród opublikowanych inicjatorów na `/zadania`: PKO Bank Polski, Totalizator Sportowy, JSW IT Systems, CPK, KG PSP oraz Ministerstwo Sportu i Turystyki.

---

## 4. Partnerzy Medialni i Społecznościowi / Akademiccy

Szerokie zaplecze komunikacyjne i studenckie zapewnia dopływ silnych zespołów uczelnianych i branżowych (zwłaszcza z Politechniki Wrocławskiej, Politechniki Warszawskiej, AGH i UKW Bydgoszcz, które triumfowały w 2025 r.):

- **Partnerzy medialni (26):** Onet, Business Insider Polska, Noizz, Komputer Świat, My Company Polska, Mam Startup, Chip, focusonbusiness.eu, IT w Administracji, Love Bydgoszcz, IT Professional, ITWiz, Zaufana Trzecia Strona, ProgramistaMag.pl, FX Mag, economista.pl, Teleinfo24.pl, Radio ESKA, Elektroda.pl, Dziennik Internautów, Taka jest Bydgoszcz, Radio PiK, Telepolis, Radio 357, PPE, Brief.
- **Partnerzy społecznościowi i akademiccy (31):** Zielona Góra JUG, Wise People, Teoria Biznesu, SJSI, OPI, Not The Hidden Wiki (`nthw`), No Fluff Jobs, MeetJS, KSI, KMS, Kościuszkon (PK), KN Solvro (PWr), Kielce Java, Helion, DevIT Jobs, Best Hacking League (BHL), Android.com.pl, Cyfrowe.org, Testerzy.pl, Teatrikon, SFI, PTI, KNN Neuron (PWr), Just Join IT, Wydział Informatyki AGH, Girls Code Fun, Forum STEM, Brand24, HackYeah, Bydgoski Klaster Informatyczny (BKI), 4Developers.
