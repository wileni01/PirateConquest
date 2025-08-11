Pirate Conquest – Performance Baseline (Initial)

Scopes
- Menu idle, World sail, Small skirmish, Large battle – 60s each.

Method
- Run with `?perf=1` to auto-execute scenarios.
- Metrics captured per-frame: dt, fps, updateMs, aiMs, collisionMs, drawCalls, heapUsedMB.
- CSVs emitted to browser downloads and to console as METRIC_CSV markers.

Environment
- Chrome: fill in
- GPU: fill in
- Resolution: fill in
- OS: Windows 10 (build 26100)

Flamegraphs & Screenshots
- Attach Chrome Performance panel captures for each scenario.

Baseline Numbers (first run)
- Menu idle: no data captured
- World sail: avg FPS 60.0, p1 57.5, p99 63.3, update 0.1ms, ai 0.0ms, collision 0.0ms, draw calls 61.1
- Small skirmish: avg FPS 60.1, p1 57.5, p99 62.9, update 0.1ms, ai 0.0ms, collision 0.0ms, draw calls 109.8
- Large battle: avg FPS 61.6, p1 41.0, p99 90.1, update 0.0ms, ai 0.0ms, collision 0.0ms, draw calls 240.0

Notes
- GeoJSON load timing is logged as PERF_GEOJSON entries.


