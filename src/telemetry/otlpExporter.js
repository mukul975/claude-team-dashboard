/**
 * OpenTelemetry-compatible trace export for Claude Code agent team runs.
 *
 * Mapping (per issue #32):
 *   Team run     -> Trace (root span `team.run:<teamName>`)
 *   Agent task   -> Span (child of the team span) with task attributes
 *   Message sent -> Span event attached to the owning task span (or team span)
 *   Completed    -> Span status OK
 *
 * Export is strictly opt-in: nothing is created or exported unless the
 * telemetry config has `enabled: true` (see ./telemetryConfig).
 */

const { loadTelemetryConfig } = require('./telemetryConfig');

// Lazy singletons — created on first enabled export so the OTel SDK is never
// loaded (and no network calls are ever made) while telemetry is disabled.
let provider = null;
let tracer = null;

// Injectable SDK modules for tests (vi.mock does not intercept CJS require
// of node_modules from source files in this environment).
let sdkDeps = null;
let apiModules = null; // @opentelemetry/api captured during ensureTracer
function setSdkDepsForTesting(deps) {
  sdkDeps = deps;
  provider = null;
  tracer = null;
}

/**
 * Initializes (once) the tracer provider backed by an OTLP/HTTP exporter.
 * @param {{endpoint: string, authToken: string}} cfg
 */
function ensureTracer(cfg) {
  if (tracer) return tracer;

  let BasicTracerProvider, SimpleSpanProcessor, OTLPTraceExporter, api;
  if (sdkDeps) {
    ({ BasicTracerProvider, SimpleSpanProcessor, OTLPTraceExporter, api } = sdkDeps);
  } else {
    // Required lazily so disabled installs never touch these modules
    ({ BasicTracerProvider, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base'));
    ({ OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http'));
    api = require('@opentelemetry/api');
  }
  apiModules = api;

  const headers = {};
  if (cfg.authToken) {
    headers.Authorization = `Bearer ${cfg.authToken}`;
  }

  const exporter = new OTLPTraceExporter({
    url: cfg.endpoint,
    headers
  });

  provider = new BasicTracerProvider();
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register(); // set as global provider so context propagation works
  tracer = provider.getTracer('claude-code-dashboard');
  return tracer;
}

/**
 * Exports one completed team run as a trace.
 * No-ops (safely) when telemetry is disabled or errors occur — telemetry
 * must never break the dashboard.
 *
 * @param {string} teamName - Name of the team whose run completed
 * @param {Array<Object>} tasks - Tasks with { id, subject, status, owner?, completedAt?, updatedAt? }
 * @param {Array<Object>} [messages] - Messages with { taskId?, agentName?, content, timestamp? }
 * @returns {Promise<boolean>} True when a trace was exported
 */
async function traceTeamRun(teamName, tasks, messages = []) {
  let cfg;
  try {
    cfg = await loadTelemetryConfig();
  } catch (err) {
    console.error('[TELEMETRY] Failed to load telemetry config:', err.message);
    return false;
  }

  if (!cfg.enabled) return false;

  try {
    const t = ensureTracer(cfg);
    const { ROOT_CONTEXT, trace } = apiModules;
    const taskList = Array.isArray(tasks) ? tasks : [];
    const teamSpan = t.startSpan(`team.run:${teamName}`, {
      startTime: Date.now(),
      attributes: {
        'team.name': teamName,
        'team.agent_count': taskList.length,
        'ai.system': 'claude-code'
      }
    });

    // Attach messages as span events on the team span (or grouped per task below)
    const eventsByTask = new Map();
    for (const msg of Array.isArray(messages) ? messages : []) {
      const event = {
        name: 'message',
        attributes: {
          'message.agent': msg.agentName || 'unknown',
          'message.content': String(msg.content || '').slice(0, 512)
        },
        time: msg.timestamp ? new Date(msg.timestamp) : undefined
      };
      const key = msg.taskId || '__team__';
      if (!eventsByTask.has(key)) eventsByTask.set(key, []);
      eventsByTask.get(key).push(event);
    }
    for (const event of eventsByTask.get('__team__') || []) {
      teamSpan.addEvent(event.name, event.attributes, event.time);
    }

    for (const task of taskList) {
      const taskCtx = trace.setSpan(ROOT_CONTEXT, teamSpan);
      const taskSpan = t.startSpan(
        `task:${task.subject || task.id || 'unnamed'}`,
        {
          startTime: Date.now(),
          attributes: {
            'task.id': String(task.id || ''),
            'task.status': String(task.status || 'unknown'),
            'task.owner': String(task.owner || 'unassigned')
          }
        },
        taskCtx
      );

      for (const event of eventsByTask.get(String(task.id)) || []) {
        taskSpan.addEvent(event.name, event.attributes, event.time);
      }

      if (task.status === 'completed') {
        taskSpan.setStatus({ code: 1 }); // SpanStatusCode.OK
      }
      taskSpan.end(task.completedAt || task.updatedAt ? new Date(task.completedAt || task.updatedAt) : undefined);
    }

    teamSpan.end();
    return true;
  } catch (err) {
    console.error('[TELEMETRY] Failed to export team run trace:', err.message);
    return false;
  }
}

/** Test/teardown helper: shuts down the provider if it was initialized. */
async function shutdownTelemetry() {
  if (provider) {
    try {
      await provider.shutdown();
    } catch {
      // ignore
    }
    provider = null;
    tracer = null;
  }
}

module.exports = { traceTeamRun, shutdownTelemetry, setSdkDepsForTesting };
