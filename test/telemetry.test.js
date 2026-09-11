import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// The telemetry config location is overridable via env so tests can use a
// real temp file instead of mocking fs (CJS requires aren't interceptable).
const tmpDir = path.join(os.tmpdir(), `telemetry-test-${process.pid}`);
const tmpConfig = path.join(tmpDir, 'telemetry.json');

const otel = vi.hoisted(() => {
  const createdSpans = [];
  let exporterOptions = null;

  const makeSpan = (name, opts = {}, ctx) => {
    const span = {
      name,
      attributes: Object.assign({}, (opts && opts.attributes) || {}),
      context: ctx,
      events: [],
      status: null,
      endTimestamp: null,
      context: ctx,
      spanContext: () => ({ traceId: 'trace-1', spanId: `span-${createdSpans.length}` }),
      setAttributes(attrs) {
        Object.assign(this.attributes, attrs);
      },
      addEvent(name, attrs, time) {
        this.events.push({ name, attributes: attrs || {}, time });
      },
      setStatus(status) {
        this.status = status;
      },
      end(timestamp) {
        this.endTimestamp = timestamp;
      }
    };
    createdSpans.push(span);
    return span;
  };

  const fakeTracer = {
    startSpan(name, opts = {}, ctx) {
      return makeSpan(name, opts, ctx);
    }
  };

  class BasicTracerProvider {
    addSpanProcessor() {}
    register() {}
    getTracer() {
      return fakeTracer;
    }
    async shutdown() {}
  }
  class SimpleSpanProcessor {}

  class OTLPTraceExporter {
    constructor(options) {
      exporterOptions = options;
    }
  }

  const api = { ROOT_CONTEXT: { mock: 'root' }, trace: { setSpan: (root, span) => ({ root, span }) }, context: {} };

  return { createdSpans, getExporterOptions: () => exporterOptions, BasicTracerProvider, SimpleSpanProcessor, OTLPTraceExporter, api };
});

async function writeConfig(obj) {
  await fs.mkdir(tmpDir, { recursive: true });
  if (obj === null) {
    await fs.rm(tmpConfig, { force: true });
    return;
  }
  await fs.writeFile(tmpConfig, JSON.stringify(obj, null, 2), 'utf8');
}

describe('Telemetry (OpenTelemetry export)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    process.env.CLAUDE_TELEMETRY_CONFIG = tmpConfig;
    otel.createdSpans.length = 0;
    await writeConfig(null);
    const exporterMod = await import('../src/telemetry/otlpExporter');
    exporterMod.setSdkDepsForTesting(otel);
  });

  afterEach(async () => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.CLAUDE_TELEMETRY_CONFIG;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('telemetryConfig', () => {
    it('returns safe defaults when no config file exists', async () => {
      const { loadTelemetryConfig } = await import('../src/telemetry/telemetryConfig');
      const cfg = await loadTelemetryConfig(tmpConfig);
      expect(cfg).toEqual({ enabled: false, endpoint: 'http://localhost:4318/v1/traces', authToken: '' });
    });

    it('OTEL_EXPORTER_OTLP_ENDPOINT env var overrides the stored endpoint', async () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318/v1/traces';
      await writeConfig({ enabled: true, endpoint: 'http://stored:4318/v1/traces', authToken: 'tok' });
      const { loadTelemetryConfig } = await import('../src/telemetry/telemetryConfig');
      const cfg = await loadTelemetryConfig(tmpConfig);
      expect(cfg.endpoint).toBe('http://collector:4318/v1/traces');
      expect(cfg.enabled).toBe(true);
    });

    it('saveTelemetryConfig merges into existing config and writes with mode 0600', async () => {
      await writeConfig({ enabled: false, endpoint: 'http://old:4318', authToken: 'secret' });
      const { saveTelemetryConfig } = await import('../src/telemetry/telemetryConfig');
      const saved = await saveTelemetryConfig({ enabled: true }, tmpConfig);
      expect(saved.enabled).toBe(true);
      expect(saved.endpoint).toBe('http://old:4318');
      expect(saved.authToken).toBe('secret');

      // Fresh file gets 0600 permissions
      const freshPath = path.join(tmpDir, 'fresh.json');
      await saveTelemetryConfig({}, freshPath);
      const stat = await fs.stat(freshPath);
      expect(stat.mode & 0o777).toBe(0o600);

      const onDisk = JSON.parse(await fs.readFile(tmpConfig, 'utf8'));
      expect(onDisk.enabled).toBe(true);
      expect(onDisk.endpoint).toBe('http://old:4318');
    });
  });

  describe('otlpExporter', () => {
    it('does not export when telemetry is disabled (default)', async () => {
      const { traceTeamRun } = await import('../src/telemetry/otlpExporter');
      const exported = await traceTeamRun('team-a', [{ id: '1', subject: 'T1', status: 'completed' }]);
      expect(exported).toBe(false);
      expect(otel.createdSpans).toHaveLength(0);
    });

    it('maps team run -> root span, tasks -> child spans, completed -> OK status', async () => {
      await writeConfig({ enabled: true, endpoint: 'http://collector:4318/v1/traces', authToken: 'tok' });
      const { traceTeamRun } = await import('../src/telemetry/otlpExporter');

      const exported = await traceTeamRun('team-a', [
        { id: '1', subject: 'Research', status: 'completed', owner: 'alice', completedAt: '2026-01-01T00:00:00Z' },
        { id: '2', subject: 'Build', status: 'in_progress', owner: 'bob' }
      ]);

      expect(exported).toBe(true);
      const spans = otel.createdSpans;
      expect(spans).toHaveLength(3);

      const teamSpan = spans[0];
      expect(teamSpan.name).toBe('team.run:team-a');
      expect(teamSpan.attributes['team.name']).toBe('team-a');
      expect(teamSpan.attributes['team.agent_count']).toBe(2);
      expect(teamSpan.attributes['ai.system']).toBe('claude-code');
      expect(teamSpan.endTimestamp).not.toBeNull();

      const task1 = spans[1];
      expect(task1.name).toBe('task:Research');
      expect(task1.attributes['task.id']).toBe('1');
      expect(task1.attributes['task.status']).toBe('completed');
      expect(task1.attributes['task.owner']).toBe('alice');
      expect(task1.status).toEqual({ code: 1 }); // OK
      expect(task1.endTimestamp).toEqual(new Date('2026-01-01T00:00:00Z'));

      const task2 = spans[2];
      expect(task2.attributes['task.status']).toBe('in_progress');
      expect(task2.status).toBeNull();
    });

    it('attaches messages as span events on the owning task span', async () => {
      await writeConfig({ enabled: true, endpoint: 'http://collector:4318/v1/traces', authToken: '' });
      const { traceTeamRun } = await import('../src/telemetry/otlpExporter');

      await traceTeamRun(
        'team-b',
        [{ id: '7', subject: 'Summarize', status: 'completed' }],
        [{ taskId: '7', agentName: 'alice', content: 'hello world' }]
      );

      const taskSpan = otel.createdSpans[1];
      expect(taskSpan.events).toHaveLength(1);
      expect(taskSpan.events[0].name).toBe('message');
      expect(taskSpan.events[0].attributes['message.agent']).toBe('alice');
      expect(taskSpan.events[0].attributes['message.content']).toBe('hello world');
    });

    it('passes endpoint and auth header to the OTLP exporter', async () => {
      await writeConfig({ enabled: true, endpoint: 'http://collector:4318/v1/traces', authToken: 'tok' });
      const { traceTeamRun } = await import('../src/telemetry/otlpExporter');
      await traceTeamRun('team-c', []);
      expect(otel.getExporterOptions().url).toBe('http://collector:4318/v1/traces');
      expect(otel.getExporterOptions().headers.Authorization).toBe('Bearer tok');
    });
  });
});
