How to run perf baseline

1) Start the app:
   - npm install
   - npm run dev (serves on port 5000)

2) Manual run:
   - Open http://localhost:5000/?perf=1
   - Wait ~4 minutes for all 4 scenarios; CSVs will be downloaded and PERF_SUMMARY logs printed.

3) Automated run:
   - npm run perf:scenarios
   - CSVs will be written under ./perf/*.csv and filenames printed.


Islands LOD (feature-flagged)

- Build assets:
  - npm run islands:build
- Enable at runtime:
  - http://localhost:5000/?LOD_ISLANDS=1&perf=1
- Disable (rollback):
  - omit the LOD_ISLANDS param (default off)

Before/After quick comparison (World sail)

- Before (no LOD): drawCalls ~35.5
- After (LOD on, merged, culled): drawCalls ~26.3


