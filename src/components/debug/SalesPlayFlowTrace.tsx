import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';

interface FlowSection {
  id: string;
  title: string;
  subtitle: string;
  open: boolean;
}

const NOW_UTC = new Date('2026-03-07T14:35:00Z');
const ENROLLMENT_HH = String(NOW_UTC.getUTCHours()).padStart(2, '0');
const ENROLLMENT_MM = String(NOW_UTC.getUTCMinutes()).padStart(2, '0');
const ENROLLMENT_TIME = `${ENROLLMENT_HH}:${ENROLLMENT_MM}:00`;

const CONTACTS = [
  { id: 'contact-a', firstName: 'Alice', lastName: 'Smith', email: 'alice@acme.com', company: 'Acme Corp' },
  { id: 'contact-b', firstName: 'Bob', lastName: 'Jones', email: 'bob@globex.com', company: 'Globex Inc' },
];

const UI_STEP_STATE = {
  step1: {
    index: 0,
    type: 'email' as const,
    subject: 'Hi {{firstName}}, quick intro',
    content: 'Hey {{firstName}}, I wanted to reach out...',
    scheduleType: 'immediately' as const,
    scheduledDate: undefined as string | undefined,
    sendTime: undefined as string | undefined,
    timezone: 'PST',
    delayDays: 0,
    inheritTime: undefined as boolean | undefined,
    hasTimeGap: true,
    timeGap: '30s',
  },
  step2: {
    index: 1,
    type: 'email' as const,
    subject: 'Following up, {{firstName}}',
    content: 'Just wanted to check in...',
    scheduleType: 'immediately' as const,
    scheduledDate: undefined as string | undefined,
    sendTime: undefined as string | undefined,
    timezone: 'PST',
    delayDays: 3,
    inheritTime: true,
    hasTimeGap: true,
    timeGap: '30s',
  },
};

function mapStepToPayload(step: typeof UI_STEP_STATE.step1 | typeof UI_STEP_STATE.step2, idx: number, steps: (typeof UI_STEP_STATE.step1)[]) {
  const isFirst = idx === 0;
  return {
    type: step.type,
    subject: step.subject,
    content: step.content,
    talkTrack: undefined,
    delayDays: step.delayDays,
    scheduledDate: step.scheduledDate,
    startImmediately: isFirst ? step.scheduleType === 'immediately' : false,
    hasSpecificTime: isFirst ? step.scheduleType === 'scheduled' : (step as any).inheritTime === false,
    sendTime: idx > 0 && (step as any).inheritTime !== false ? undefined : step.sendTime,
    timezone: idx > 0 && (step as any).inheritTime !== false ? undefined : step.timezone,
    inheritSendTime: idx > 0 && (step as any).inheritTime !== false,
    hasTimeGap: step.hasTimeGap,
    timeGap: step.timeGap,
  };
}

function mapPayloadToDbRow(payload: ReturnType<typeof mapStepToPayload>, idx: number, salesplayId: string) {
  return {
    salesplay_id: salesplayId,
    step_order: idx + 1,
    type: payload.type,
    subject: payload.subject || null,
    content: payload.content || null,
    talk_track: payload.talkTrack || null,
    delay_days: payload.delayDays || 0,
    scheduled_date: payload.scheduledDate || null,
    start_immediately: payload.startImmediately || false,
    has_specific_time: payload.hasSpecificTime || false,
    send_time: payload.sendTime || null,
    timezone: payload.timezone || 'PST',
    inherit_send_time: payload.inheritSendTime || false,
    has_time_gap: payload.hasTimeGap || false,
    time_gap: payload.timeGap || '30s',
  };
}

function computeTaskScheduledTime(
  step: ReturnType<typeof mapPayloadToDbRow>,
  step1ResolvedTime: string,
  step1ResolvedTimezone: string,
  enrollmentTime: string,
): { scheduled_time: string; timezone: string; logic: string } {
  if (step.step_order === 1 && step.start_immediately) {
    return {
      scheduled_time: enrollmentTime,
      timezone: 'UTC',
      logic: 'Step 1 start_immediately → use enrollment UTC time',
    };
  }
  if (step.inherit_send_time) {
    return {
      scheduled_time: step1ResolvedTime,
      timezone: step1ResolvedTimezone,
      logic: 'inherit_send_time=true → copy Step 1 resolved time',
    };
  }
  if (step.has_specific_time && step.send_time) {
    return {
      scheduled_time: step.send_time,
      timezone: step.timezone || 'UTC',
      logic: 'has_specific_time=true, send_time set → use own time',
    };
  }
  return {
    scheduled_time: enrollmentTime,
    timezone: 'UTC',
    logic: 'fallback → enrollment UTC time',
  };
}

function computeDueDate(step: ReturnType<typeof mapPayloadToDbRow>, today: Date, cumulativeDays: number): string {
  if (step.start_immediately && step.step_order === 1) {
    return today.toISOString().split('T')[0];
  }
  if (step.scheduled_date) {
    return step.scheduled_date;
  }
  const d = new Date(today);
  d.setDate(today.getDate() + cumulativeDays);
  return d.toISOString().split('T')[0];
}

type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray';

function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const classes: Record<BadgeVariant, string> = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${classes[variant]}`}>
      {children}
    </span>
  );
}

function Field({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-2 px-3 rounded-md ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>
      <span className="text-xs font-mono text-gray-500 mt-0.5 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm font-mono text-gray-900">{value}</span>
    </div>
  );
}

function Section({ title, subtitle, children, defaultOpen = false }: { title: string; subtitle: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-100">{children}</div>}
    </div>
  );
}

function StepCard({ label, bg, children }: { label: string; bg: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{label}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function NullBadge() {
  return <Badge variant="red">null</Badge>;
}

function BoolBadge({ val }: { val: boolean }) {
  return <Badge variant={val ? 'green' : 'gray'}>{String(val)}</Badge>;
}

export const SalesPlayFlowTrace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const salesplayId = 'sp-mock-001';

  const step1Payload = mapStepToPayload(UI_STEP_STATE.step1, 0, [UI_STEP_STATE.step1, UI_STEP_STATE.step2] as any);
  const step2Payload = mapStepToPayload(UI_STEP_STATE.step2, 1, [UI_STEP_STATE.step1, UI_STEP_STATE.step2] as any);

  const step1Row = mapPayloadToDbRow(step1Payload, 0, salesplayId);
  const step2Row = mapPayloadToDbRow(step2Payload, 1, salesplayId);

  const step1ResolvedTime = step1Row.start_immediately ? ENROLLMENT_TIME : (step1Row.send_time ?? ENROLLMENT_TIME);
  const step1ResolvedTimezone = step1Row.start_immediately ? 'UTC' : (step1Row.timezone || 'UTC');

  const today = NOW_UTC;
  let cumulative = 0;
  const step1DueDate = computeDueDate(step1Row, today, 0);
  cumulative += step1Row.delay_days;
  const step2DueDate = computeDueDate(step2Row, today, cumulative + step2Row.delay_days);

  const step1Task = computeTaskScheduledTime(step1Row, step1ResolvedTime, step1ResolvedTimezone, ENROLLMENT_TIME);
  const step2Task = computeTaskScheduledTime(step2Row, step1ResolvedTime, step1ResolvedTimezone, ENROLLMENT_TIME);

  const tasks = CONTACTS.flatMap(contact => [
    { contact, step: 1, due_date: step1DueDate, ...step1Task },
    { contact, step: 2, due_date: step2DueDate, ...step2Task },
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">SalesPlay Creation Flow Trace</h1>
        <p className="text-gray-600 mt-1">
          Mock scenario: 2 contacts, 2 email steps &mdash; Step 1 <Badge variant="blue">immediately</Badge>, Step 2 <Badge variant="blue">Use same time as Step 1</Badge>
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4 text-blue-500" />
          Simulated enrollment time (UTC): <Badge variant="blue">{ENROLLMENT_TIME}</Badge>
          &nbsp;on <Badge variant="gray">2026-03-07</Badge>
        </div>
      </div>

      <div className="space-y-4">

        <Section title="Stage 1 — UI Component State" subtitle="What the React state holds in CreateSalesPlay.tsx when the user clicks Create SalesPlay" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <StepCard label="Step 1 (index 0)" bg="bg-blue-50 border-blue-200">
              <Field label="type" value={<Badge variant="blue">email</Badge>} />
              <Field label="scheduleType" value={<Badge variant="green">immediately</Badge>} />
              <Field label="scheduledDate" value={<NullBadge />} />
              <Field label="sendTime" value={<NullBadge />} />
              <Field label="timezone" value={<Badge>PST</Badge>} />
              <Field label="delayDays" value={<Badge>0</Badge>} />
              <Field label="inheritTime" value={<Badge variant="gray">undefined (n/a for step 1)</Badge>} />
            </StepCard>
            <StepCard label="Step 2 (index 1)" bg="bg-emerald-50 border-emerald-200">
              <Field label="type" value={<Badge variant="blue">email</Badge>} />
              <Field label="scheduleType" value={<Badge>immediately (irrelevant for step 2+)</Badge>} />
              <Field label="sendTime" value={<NullBadge />} highlight />
              <Field label="timezone" value={<Badge>PST (irrelevant — inherit=true)</Badge>} />
              <Field label="delayDays" value={<Badge>3</Badge>} />
              <Field label="inheritTime" value={<Badge variant="green">true</Badge>} highlight />
            </StepCard>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Key observation:</strong> Step 2 <code>sendTime</code> is <code>undefined</code> — the user never set it because "Use same time as Step 1" is selected. <code>inheritTime = true</code> encodes the intent.
          </div>
        </Section>

        <div className="flex items-center justify-center py-1">
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <span className="mx-2 text-xs text-gray-400 font-mono">handleSave() → steps.map((step, idx) =&gt; ...)</span>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>

        <Section title="Stage 2 — salesplaysService.create() Input Payload" subtitle="What the frontend builds in handleSave() before calling salesplaysService.create()" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <StepCard label="Step 1 payload (idx=0)" bg="bg-blue-50 border-blue-200">
              <Field label="startImmediately" value={<BoolBadge val={step1Payload.startImmediately ?? false} />} />
              <Field label="hasSpecificTime" value={<BoolBadge val={step1Payload.hasSpecificTime ?? false} />} />
              <Field label="sendTime" value={step1Payload.sendTime ? <Badge>{step1Payload.sendTime}</Badge> : <NullBadge />} />
              <Field label="timezone" value={step1Payload.timezone ? <Badge>{step1Payload.timezone}</Badge> : <NullBadge />} />
              <Field label="inheritSendTime" value={<BoolBadge val={step1Payload.inheritSendTime ?? false} />} />
            </StepCard>
            <StepCard label="Step 2 payload (idx=1)" bg="bg-emerald-50 border-emerald-200">
              <Field label="startImmediately" value={<BoolBadge val={step2Payload.startImmediately ?? false} />} />
              <Field label="hasSpecificTime" value={<BoolBadge val={step2Payload.hasSpecificTime ?? false} />} highlight />
              <Field label="sendTime" value={step2Payload.sendTime ? <Badge>{step2Payload.sendTime}</Badge> : <NullBadge />} highlight />
              <Field label="timezone" value={step2Payload.timezone ? <Badge>{step2Payload.timezone}</Badge> : <NullBadge />} />
              <Field label="inheritSendTime" value={<BoolBadge val={step2Payload.inheritSendTime ?? false} />} highlight />
            </StepCard>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <strong>Key transformation:</strong> Because <code>inheritTime !== false</code> for Step 2, the mapping sets <code>sendTime = undefined</code>, <code>hasSpecificTime = false</code>, and <code>inheritSendTime = true</code>. This is the explicit signal carried into the DB.
          </div>
        </Section>

        <div className="flex items-center justify-center py-1">
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <span className="mx-2 text-xs text-gray-400 font-mono">stepsToInsert = steps.map(...) → supabase.from('salesplay_steps').insert(...)</span>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>

        <Section title="Stage 3 — salesplay_steps DB Rows" subtitle="What gets written to the salesplay_steps table" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <StepCard label="step_order = 1" bg="bg-blue-50 border-blue-200">
              <Field label="start_immediately" value={<BoolBadge val={step1Row.start_immediately} />} />
              <Field label="has_specific_time" value={<BoolBadge val={step1Row.has_specific_time} />} />
              <Field label="send_time" value={step1Row.send_time ? <Badge>{step1Row.send_time}</Badge> : <NullBadge />} />
              <Field label="timezone" value={<Badge>{step1Row.timezone}</Badge>} />
              <Field label="inherit_send_time" value={<BoolBadge val={step1Row.inherit_send_time} />} />
              <Field label="delay_days" value={<Badge>0</Badge>} />
            </StepCard>
            <StepCard label="step_order = 2" bg="bg-emerald-50 border-emerald-200">
              <Field label="start_immediately" value={<BoolBadge val={step2Row.start_immediately} />} />
              <Field label="has_specific_time" value={<BoolBadge val={step2Row.has_specific_time} />} highlight />
              <Field label="send_time" value={step2Row.send_time ? <Badge>{step2Row.send_time}</Badge> : <NullBadge />} highlight />
              <Field label="timezone" value={<Badge>{step2Row.timezone}</Badge>} />
              <Field label="inherit_send_time" value={<BoolBadge val={step2Row.inherit_send_time} />} highlight />
              <Field label="delay_days" value={<Badge>{step2Row.delay_days}</Badge>} />
            </StepCard>
          </div>
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            <strong>What's in the DB:</strong> Step 2 has <code>send_time = NULL</code>, <code>has_specific_time = false</code>, <code>inherit_send_time = TRUE</code>.
            The <code>inherit_send_time</code> column (added by migration) is the authoritative flag for task creation logic.
          </div>
        </Section>

        <div className="flex items-center justify-center py-1">
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <span className="mx-2 text-xs text-gray-400 font-mono">addContactsToSalesPlay(salesPlayId, [contact-a, contact-b])</span>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>

        <Section title="Stage 4 — Task Scheduled Time Resolution" subtitle="How addContactsToSalesPlay() resolves scheduled_time for each step" defaultOpen>
          <div className="mt-3 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-semibold text-blue-900 mb-2">Pre-computation: Step 1 resolved time</div>
              <div className="space-y-1.5">
                <Field label="step1.start_immediately" value={<BoolBadge val={step1Row.start_immediately} />} />
                <Field label="enrollment UTC time" value={<Badge variant="blue">{ENROLLMENT_TIME}</Badge>} />
                <Field label="→ step1ResolvedTime" value={<Badge variant="green">{step1ResolvedTime}</Badge>} highlight />
                <Field label="→ step1ResolvedTimezone" value={<Badge variant="green">{step1ResolvedTimezone}</Badge>} highlight />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Because <code>start_immediately = true</code>, we use the enrollment UTC time as step1ResolvedTime.
                This is the value that all <code>inherit_send_time</code> steps will copy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-900 mb-2">Step 1 task resolution</div>
                <div className="space-y-1.5">
                  <Field label="condition" value={<Badge variant="blue">step_order=1 AND start_immediately</Badge>} />
                  <Field label="→ scheduled_time" value={<Badge variant="green">{step1Task.scheduled_time}</Badge>} highlight />
                  <Field label="→ timezone" value={<Badge variant="green">{step1Task.timezone}</Badge>} />
                  <Field label="→ due_date" value={<Badge>{step1DueDate}</Badge>} />
                </div>
                <p className="text-xs text-blue-700 mt-2 italic">{step1Task.logic}</p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="font-semibold text-emerald-900 mb-2">Step 2 task resolution</div>
                <div className="space-y-1.5">
                  <Field label="condition" value={<Badge variant="green">inherit_send_time = true</Badge>} />
                  <Field label="step1ResolvedTime" value={<Badge variant="blue">{step1ResolvedTime}</Badge>} />
                  <Field label="→ scheduled_time" value={<Badge variant="green">{step2Task.scheduled_time}</Badge>} highlight />
                  <Field label="→ timezone" value={<Badge variant="green">{step2Task.timezone}</Badge>} />
                  <Field label="→ due_date" value={<Badge>{step2DueDate}</Badge>} />
                </div>
                <p className="text-xs text-emerald-700 mt-2 italic">{step2Task.logic}</p>
              </div>
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-center py-1">
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <span className="mx-2 text-xs text-gray-400 font-mono">supabase.from('tasks').insert(tasksToCreate)</span>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>

        <Section title="Stage 5 — Final tasks Table Rows (4 total)" subtitle="What gets written for 2 contacts × 2 steps" defaultOpen>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2 font-semibold text-gray-700 rounded-tl-lg">Contact</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Step</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">due_date</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">scheduled_time</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">timezone</th>
                  <th className="px-3 py-2 font-semibold text-gray-700 rounded-tr-lg">Resolution logic</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${t.step === 2 ? 'bg-emerald-50' : 'bg-white'}`}>
                    <td className="px-3 py-2 font-mono text-gray-900">{t.contact.firstName} {t.contact.lastName}</td>
                    <td className="px-3 py-2"><Badge variant={t.step === 1 ? 'blue' : 'green'}>Step {t.step}</Badge></td>
                    <td className="px-3 py-2 font-mono">{t.due_date}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-gray-900">{t.scheduled_time}</td>
                    <td className="px-3 py-2 font-mono">{t.timezone}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 italic">{t.logic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 inline mr-1.5 text-emerald-600" />
            <strong>Both Step 2 tasks get scheduled_time = {step2Task.scheduled_time} UTC</strong> — identical to Step 1. This is correct: "Use same time as Step 1" with Step 1 being "immediately" means both steps fire at the enrollment time on their respective due dates.
          </div>
        </Section>

        <Section title="What Was Broken (Pre-Fix) vs What Is Fixed Now" subtitle="The exact bug introduced by the previous code path">
          <div className="mt-3 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Old Code — handleSave() Step 2 mapping
              </div>
              <pre className="text-xs bg-red-100 rounded p-3 overflow-x-auto text-red-800">{`// OLD (broken)
sendTime:   idx > 0 && step.inheritTime ? steps[0].sendTime : step.sendTime,
//          ↑ copies steps[0].sendTime = undefined  (step 1 is "immediately", no sendTime)

timezone:   idx > 0 && step.inheritTime ? steps[0].timezone : step.timezone,
//          ↑ copies "PST" from step 1 UI state

hasSpecificTime: idx === 0 ? step.scheduleType === 'scheduled' : !step.inheritTime,
//               ↑ !true = false — accidentally correct but for wrong reason

inheritTime: step.inheritTime,
//           ↑ sent as field in payload but never read in create() or addContactsToSalesPlay()

// Result in DB:
//   send_time = NULL  ← undefined coerces to null
//   timezone = "PST"
//   has_specific_time = false
//   (no inherit_send_time column existed)

// Result in addContactsToSalesPlay():
//   condition: !step.has_specific_time && !step.send_time → TRUE (accidentally)
//   → used enrollment UTC time as fallback (correct result, wrong path)
//   BUT: if has_specific_time were true for some reason, it would try send_time=null`}</pre>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> New Code — explicit intent at every stage
              </div>
              <pre className="text-xs bg-emerald-100 rounded p-3 overflow-x-auto text-emerald-800">{`// NEW (fixed)
sendTime:       idx > 0 && step.inheritTime !== false ? undefined : step.sendTime,
//              ↑ explicitly undefined — not copying step 1's sendTime at all

timezone:       idx > 0 && step.inheritTime !== false ? undefined : step.timezone,
//              ↑ explicitly undefined

hasSpecificTime: idx === 0 ? step.scheduleType === 'scheduled' : step.inheritTime === false,
//               ↑ strict false check — true only when user chose "Specific time"

inheritSendTime: idx > 0 && step.inheritTime !== false,
//               ↑ NEW explicit flag sent to create()

// Result in DB (new column):
//   send_time = NULL
//   has_specific_time = false
//   inherit_send_time = TRUE   ← authoritative intent

// Result in addContactsToSalesPlay():
//   if (step.inherit_send_time) → TRUE
//   → scheduled_time = step1ResolvedTime (computed before loop)
//   → timezone = step1ResolvedTimezone
//   No accident, no ambiguity.`}</pre>
            </div>
          </div>
        </Section>

        <Section title="Edge Cases Covered" subtitle="Scenarios the new code handles correctly that the old code did not">
          <div className="mt-3 space-y-3">
            {[
              {
                label: 'Step 1 = immediately, Step 2 = inherit',
                old: 'Worked by accident: null send_time + !has_specific_time → fallback to enrollment time',
                new: 'Explicit: inherit_send_time=true → copy step1ResolvedTime (enrollment UTC)',
                ok: true,
              },
              {
                label: 'Step 1 = scheduled 09:00 PST, Step 2 = inherit',
                old: 'Old code copied steps[0].sendTime = "09:00" AND timezone = "PST" into DB. addContactsToSalesPlay used the old isImmediateStep check which would check !has_specific_time && !send_time → FALSE (send_time was "09:00"). So it used "09:00" PST — correct but fragile.',
                new: 'inherit_send_time=true → step1ResolvedTime = "09:00", step1ResolvedTimezone = "PST". Same result, explicit path.',
                ok: true,
              },
              {
                label: 'Step 2 = Specific time 14:00 EST (inherit=false)',
                old: 'inheritTime=false → hasSpecificTime = !false = true, sendTime = step.sendTime = "14:00". Correct.',
                new: 'inheritTime===false → hasSpecificTime=true, inheritSendTime=false, sendTime="14:00". Same correct result, explicit.',
                ok: true,
              },
              {
                label: 'inheritTime = undefined (new step default before user interaction)',
                old: '!undefined = true → hasSpecificTime=false. sendTime: undefined !== undefined is false → copies steps[0].sendTime. Subtle bug if step 1 has sendTime set.',
                new: 'undefined !== false → inheritSendTime=true, sendTime=undefined. Treated as inherit, which matches the UI default.',
                ok: true,
              },
            ].map((edge, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-gray-900">{edge.label}</span>
                </div>
                <div className="ml-6 space-y-1 text-sm">
                  <p className="text-red-700"><span className="font-mono text-xs bg-red-100 px-1 rounded">OLD</span> {edge.old}</p>
                  <p className="text-emerald-700"><span className="font-mono text-xs bg-emerald-100 px-1 rounded">NEW</span> {edge.new}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
};
