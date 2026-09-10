# Skill provenance

These are upstream instruction documents, loaded only when a workspace opts in. No upstream executable plugin hooks are installed or executed. The source repositories and their included licenses govern the vendored files.

- Ponytail: https://github.com/DietrichGebert/ponytail — source path `skills/ponytail/SKILL.md`; SHA-256 `1316a2f3f95741d2300b116fe0c2d81ce4a9568656ed0a62643f54aaf09957f2`. Loaded only in Coding Mode, never Business Mode.
- Caveman: https://github.com/JuliusBrussee/caveman — source path `skills/caveman/SKILL.md`; SHA-256 `c4d7354b4b063d54601fcdd5097a5b1713d1a1a2e386ac39efa438aa1ffef8ce`. Loaded on opt-in in either mode. Its boundaries preserve normal prose for third-party deliverables.

Both were fetched from their default branch during this implementation. The byte hashes pin the actual vendored contents; future refreshes should explicitly review the diff, licensing, scope, and tests rather than downloading mutable instructions during a user session.
