---
description: Performance monitoring and optimization with k6 load testing, Prometheus queries, Grafana dashboards, and profiling tools
arguments:
  - name: action
    description: "Action: test, query, dashboard, profile, or analyze"
    required: true
  - name: target
    description: "Target endpoint, service, or metric name"
    required: false
---

# Perf Command

Monitor and optimize application performance with load testing, metrics querying, dashboard management, and profiling capabilities.

## Usage

```bash
/perf <action> [target]
```

## Examples

```bash
# Run load tests
/perf test api

# Query Prometheus metrics
/perf query http_requests_total

# Create Grafana dashboard
/perf dashboard

# Profile application
/perf profile cpu

# Analyze performance
/perf analyze
```

## Execution Flow

### 1. Load Testing with k6

#### Basic Load Test

```javascript
// tests/load/api.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check duration < 100ms': (r) => r.timings.duration < 100,
  });

  // API endpoints
  const endpoints = [
    { method: 'GET', url: '/api/users', name: 'list_users' },
    { method: 'GET', url: '/api/products', name: 'list_products' },
    { method: 'GET', url: '/api/orders', name: 'list_orders' },
  ];

  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint.url}`, {
      tags: { name: endpoint.name },
    });

    const success = check(res, {
      [`${endpoint.name} status is 200`]: (r) => r.status === 200,
      [`${endpoint.name} duration < 500ms`]: (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/load/results/summary.json': JSON.stringify(data),
    'tests/load/results/summary.html': htmlReport(data),
  };
}
```

#### Run Load Tests

```bash
# Basic run
k6 run tests/load/api.k6.js

# With environment variables
k6 run -e BASE_URL=https://staging-api.example.com tests/load/api.k6.js

# Output to InfluxDB for Grafana
k6 run --out influxdb=http://localhost:8086/k6 tests/load/api.k6.js

# Cloud execution
k6 cloud tests/load/api.k6.js

# Specific test scenarios
k6 run --env SCENARIO=spike tests/load/api.k6.js
```

#### Stress Test Template

```javascript
// tests/load/stress.k6.js
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '10m', target: 0 },
  ],
};
```

#### Spike Test Template

```javascript
// tests/load/spike.k6.js
export const options = {
  stages: [
    { duration: '10s', target: 100 },  // Instant spike
    { duration: '1m', target: 100 },
    { duration: '10s', target: 1000 }, // Massive spike
    { duration: '3m', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
};
```

### 2. Prometheus Queries

#### Common PromQL Queries

```bash
# Request rate (requests per second)
rate(http_requests_total[5m])

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# P99 latency
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# CPU usage by container
sum(rate(container_cpu_usage_seconds_total{container!=""}[5m])) by (container)

# Memory usage by container
sum(container_memory_usage_bytes{container!=""}) by (container)

# Active connections
sum(nginx_connections_active) by (instance)

# Request duration by endpoint
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, handler))
```

#### Query via CLI

```bash
# Using promtool
promtool query instant http://prometheus:9090 'rate(http_requests_total[5m])'

# Using curl
curl -s "http://prometheus:9090/api/v1/query" \
  --data-urlencode 'query=rate(http_requests_total[5m])' | jq '.data.result'

# Range query
curl -s "http://prometheus:9090/api/v1/query_range" \
  --data-urlencode 'query=rate(http_requests_total[5m])' \
  --data-urlencode 'start=2024-01-01T00:00:00Z' \
  --data-urlencode 'end=2024-01-02T00:00:00Z' \
  --data-urlencode 'step=15s' | jq '.data.result'
```

### 3. Grafana Dashboards

#### Dashboard JSON Template

```json
{
  "dashboard": {
    "id": null,
    "uid": "app-performance",
    "title": "Application Performance",
    "tags": ["production", "performance"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time P95",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "gridPos": { "h": 4, "w": 6, "x": 0, "y": 8 },
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "format": "percent"
      },
      {
        "id": 4,
        "title": "CPU Usage",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 0, "y": 12 },
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total{container!=\"\"}[5m])) by (container) * 100",
            "legendFormat": "{{container}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "graph",
        "gridPos": { "h": 8, "w": 12, "x": 12, "y": 12 },
        "targets": [
          {
            "expr": "sum(container_memory_usage_bytes{container!=\"\"}) by (container) / 1024 / 1024",
            "legendFormat": "{{container}}"
          }
        ],
        "yaxes": [{ "format": "decmbytes" }]
      }
    ]
  }
}
```

#### Create Dashboard via API

```bash
# Create dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d @dashboard.json \
  "${GRAFANA_URL}/api/dashboards/db"

# Import dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d '{"dashboard": {...}, "overwrite": true}' \
  "${GRAFANA_URL}/api/dashboards/import"
```

### 4. Application Profiling

#### Node.js Profiling

```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Heap snapshot
node --inspect app.js
# Connect to chrome://inspect and take heap snapshot

# Using clinic.js
npx clinic doctor -- node app.js
npx clinic flame -- node app.js
npx clinic bubbleprof -- node app.js
```

#### Python Profiling

```bash
# cProfile
python -m cProfile -o output.prof app.py
python -m pstats output.prof

# py-spy (sampling profiler)
py-spy record -o profile.svg -- python app.py

# memory_profiler
python -m memory_profiler app.py
```

#### Go Profiling

```bash
# CPU profiling
go test -cpuprofile=cpu.prof -bench .
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof -bench .
go tool pprof mem.prof

# HTTP pprof endpoint
# Add: import _ "net/http/pprof"
go tool pprof http://localhost:6060/debug/pprof/profile
```

### 5. Performance Analysis

```bash
# Analyze load test results
k6 inspect tests/load/api.k6.js

# Generate performance report
cat > performance-report.md << EOF
# Performance Analysis Report

## Summary
- Test Duration: ${DURATION}
- Virtual Users: ${VUS}
- Total Requests: ${TOTAL_REQUESTS}
- Error Rate: ${ERROR_RATE}%

## Response Times
| Metric | Value |
|--------|-------|
| Average | ${AVG_RESPONSE}ms |
| P50 | ${P50}ms |
| P95 | ${P95}ms |
| P99 | ${P99}ms |
| Max | ${MAX_RESPONSE}ms |

## Throughput
- Requests/sec: ${RPS}
- Data received: ${DATA_RECEIVED}
- Data sent: ${DATA_SENT}

## Recommendations
${RECOMMENDATIONS}
EOF
```

## SLO Definitions

```yaml
# slo.yaml
slos:
  - name: api-availability
    description: API should be available 99.9% of the time
    target: 99.9
    window: 30d
    indicator:
      type: availability
      query: |
        sum(rate(http_requests_total{status!~"5.."}[5m]))
        / sum(rate(http_requests_total[5m]))

  - name: api-latency
    description: 95% of requests should complete within 500ms
    target: 95
    window: 30d
    indicator:
      type: latency
      threshold: 500ms
      query: |
        histogram_quantile(0.95,
          sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
        ) < 0.5
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                 PERFORMANCE REPORT                            ║
╠══════════════════════════════════════════════════════════════╣
║ Test: API Load Test                                           ║
║ Duration: 10m                                                 ║
║ Virtual Users: 50                                             ║
╠══════════════════════════════════════════════════════════════╣
║ RESULTS                                                       ║
║                                                               ║
║ Total Requests:     45,234                                    ║
║ Successful:         44,892 (99.2%)                           ║
║ Failed:             342 (0.8%)                                ║
║                                                               ║
║ Response Times:                                               ║
║   Average:          145ms                                     ║
║   P50:              98ms                                      ║
║   P95:              342ms   ✅ (target: <500ms)              ║
║   P99:              567ms   ⚠️ (target: <1000ms)             ║
║   Max:              2,341ms                                   ║
║                                                               ║
║ Throughput:         75.4 req/s                               ║
╠══════════════════════════════════════════════════════════════╣
║ SLO STATUS                                                    ║
║                                                               ║
║   Availability:     99.2%   ✅ (target: 99.9%)               ║
║   Latency P95:      342ms   ✅ (target: <500ms)              ║
║   Error Rate:       0.8%    ✅ (target: <1%)                 ║
╠══════════════════════════════════════════════════════════════╣
║ RECOMMENDATIONS                                               ║
║                                                               ║
║   ⚠️ P99 latency approaching threshold                       ║
║   💡 Consider caching for /api/products endpoint             ║
║   💡 Database query optimization needed for /api/orders      ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BASE_URL` | Target URL for load tests | For testing |
| `PROMETHEUS_URL` | Prometheus server URL | For queries |
| `GRAFANA_URL` | Grafana server URL | For dashboards |
| `GRAFANA_API_KEY` | Grafana API key | For dashboards |

## Related Commands

- `/status` - View performance metrics
- `/deploy` - Deploy performance fixes
- `/quality` - Check code quality
