# HackNation 2026 — Baza Wiedzy i Research

Kompleksowe, ustrukturyzowane kompendium przed wyjazdem na **HackNation 2026** (21–22 listopada 2026 r., BCTW Bydgoszcz), zebrane bezpośrednio z kodu źródłowego i dokumentów `https://hacknation.pl/`, `https://transporthacknation.pl/` oraz źródeł publicznych o edycji 2025.

## Struktura repozytorium

- [AGENTS.md](AGENTS.md) — główny manifest i instrukcje routingu dla agentów AI.
- **`data/`** — ustrukturyzowane dane JSON gotowe pod analizę skryptową i LLM:
  - [event_overview.json](data/event_overview.json)
  - [challenges_2026.json](data/challenges_2026.json)
  - [archive_2025.json](data/archive_2025.json)
  - [sponsors_profiles.json](data/sponsors_profiles.json)
  - [agenda_and_logistics.json](data/agenda_and_logistics.json)
  - [rules_and_evaluation.json](data/rules_and_evaluation.json)
  - [challenges_decision_matrix.json](data/challenges_decision_matrix.json)
  - [kowr_water_crops_research.json](data/kowr_water_crops_research.json)
- **`docs/`** — pogłębione opracowania analityczne w Markdown:
  - [01_overview_and_faq.md](docs/01_overview_and_faq.md)
  - [02_regulamin_and_evaluation.md](docs/02_regulamin_and_evaluation.md)
  - [03_challenges_2026_catalog.md](docs/03_challenges_2026_catalog.md)
  - [04_archive_2025_winners_analysis.md](docs/04_archive_2025_winners_analysis.md)
  - [05_sponsors_and_stakeholders_profile.md](docs/05_sponsors_and_stakeholders_profile.md)
  - [06_trip_plan_agenda_and_logistics.md](docs/06_trip_plan_agenda_and_logistics.md)
  - [07_challenges_decision_matrix_and_deep_dive.md](docs/07_challenges_decision_matrix_and_deep_dive.md)
  - [08_polish_hackathons_benchmark_and_success_factors.md](docs/08_polish_hackathons_benchmark_and_success_factors.md)
  - [09_kowr_zatrzymaj_wode_deep_dive_and_pwa_concepts.md](docs/09_kowr_zatrzymaj_wode_deep_dive_and_pwa_concepts.md)
- **`raw/`** — surowe pliki źródłowe ze scrapingu (`pages/`, `js/`, `pdfs/` w tym 5 oryginalnych dokumentów PDF, `extracted/` w tym pełna lista 105 mentorów w `raw/extracted/mentors_parsed.json`).

## Najważniejsze terminy przed i w trakcie wyjazdu

- **Do 17.11.2026 godz. 23:00 CET:** Rezerwacja lub zmiana bezpłatnego autokaru na [transporthacknation.pl](https://transporthacknation.pl/).
- **Sobota 21.11.2026, 08:00:** Rejestracja i śniadanie w BCTW (ul. Gdańska 187, Bydgoszcz).
- **Sobota 21.11.2026, 11:00:** Publikacja pełnych treści zadań, regulaminów kategorii i start 24-godzinnego kodowania.
- **Sobota 21.11.2026, 20:00:** Twardy deadline na utworzenie **Draftu projektu na HackTribe** i wybór zadania.
- **Niedziela 22.11.2026, 11:00:** Koniec kodowania i ostateczny termin złożenia projektu (PDF ≤ 10 MB, demo, repo).
- **Niedziela 22.11.2026, 14:45 / 15:15 / 17:15:** Ogłoszenie TOP 5 finalistów / Pitching / Ceremonia zamknięcia.
- **Niedziela 22.11.2026, ok. 18:30:** Odjazd autokarów powrotnych spod BCTW.
