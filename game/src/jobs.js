// Side jobs: taxi runs from the Menara stand and courier deliveries.
// Repeatable, paid in cash and respect; missions reuse the taxi job.
import { JOB_PAY } from './config.js';
import { addRespect, respectForJob } from './respect.js';

const TAXI_SPOTS = [
  { x: 60, z: -120, label: 'Plaza Menara' },
  { x: -160, z: 40, label: 'Pasar Malam' },
  { x: 235, z: 100, label: 'Dermaga 7' },
  { x: -80, z: -300, label: 'Boardwalk Pantai' },
  { x: 20, z: -100, label: 'Balai Kota' },
];
const DELIVERY_SPOTS = [
  { x: -100, z: -20, label: 'Kafe Senja' },
  { x: 80, z: -60, label: 'Bank Bara' },
  { x: -228, z: 188, label: 'Safehouse' },
  { x: 90, z: -380, label: 'Viewpoint Bukit' },
];

export function startTaxiJob(state, stops) {
  const count = stops || 3;
  const queue = [];
  for (let i = 0; i < count; i += 1) queue.push(TAXI_SPOTS[(Math.floor(Math.random() * TAXI_SPOTS.length) + i) % TAXI_SPOTS.length]);
  state.job = { type: 'taxi', queue, index: 0, phase: 'pickup', timer: 150, pay: JOB_PAY.taxi };
  const first = queue[0];
  state.objective = { text: 'Taksi: jemput penumpang di ' + first.label, x: first.x, z: first.z, kind: 'job' };
  state.message = 'Job taksi: jemput penumpang pertama.';
  state.messageTimer = 3;
  return state.job;
}

export function startDeliveryJob(state) {
  const queue = DELIVERY_SPOTS.slice(0, 3);
  state.job = { type: 'delivery', queue, index: 0, phase: 'drop', timer: 150, pay: JOB_PAY.delivery };
  const first = queue[0];
  state.objective = { text: 'Delivery: antar ke ' + first.label, x: first.x, z: first.z, kind: 'job' };
  state.message = 'Job delivery: antar 3 paket.';
  state.messageTimer = 3;
  return state.job;
}

export function updateJob(state, dt) {
  const job = state.job;
  if (!job) return;
  job.timer -= dt;
  if (job.timer <= 0) {
    state.message = 'Job gagal: waktu habis.';
    state.messageTimer = 3;
    state.flags.taxiFailed = true;
    state.job = null;
    state.objective = { text: 'Lanjutkan misi', x: state.mission ? state.mission.steps[state.missionStep].x : -190, z: state.mission ? state.mission.steps[state.missionStep].z : 140, kind: 'goto' };
    return;
  }
  const target = (job.type === 'taxi' && job.phase === 'drop' && job.dropTarget) ? job.dropTarget : job.queue[job.index];
  const d = Math.hypot(state.player.x - target.x, state.player.z - target.z);
  if (d < 8) {
    if (job.type === 'taxi' && job.phase === 'pickup') {
      job.phase = 'drop';
      const dest = job.queue[(job.index + 1) % job.queue.length];
      state.objective = { text: 'Taksi: antar penumpang ke ' + dest.label, x: dest.x, z: dest.z, kind: 'job' };
      state.message = 'Penumpang naik. Antar ke ' + dest.label + '.';
      state.messageTimer = 2;
      job.pickupTarget = target;
      job.dropTarget = dest;
      return;
    }
    job.index += 1;
    state.money += job.pay;
    addRespect(state, respectForJob());
    state.stats.jobsDone += 1;
    if (job.index >= job.queue.length) {
      state.message = 'Job selesai! +$' + (job.pay * job.queue.length) + ' total.';
      state.messageTimer = 3;
      if (job.type === 'taxi') state.flags.taxiDone = true;
      state.job = null;
      return;
    }
    const next = job.queue[job.index];
    state.objective = { text: (job.type === 'taxi' ? 'Taksi: jemput di ' : 'Delivery: antar ke ') + next.label, x: next.x, z: next.z, kind: 'job' };
    job.phase = job.type === 'taxi' ? 'pickup' : 'drop';
  }
}

// Job state for the HUD and minimap: where the job points right now.
export function jobTarget(state) {
  if (!state.job) return null;
  const target = state.job.queue[state.job.index];
  if (!target) return null;
  if (state.job.type === 'taxi' && state.job.phase === 'drop' && state.job.dropTarget) return state.job.dropTarget;
  return target;
}
export function jobLabel(state) {
  if (!state.job) return '';
  return state.job.type === 'taxi' ? 'TAKSI' : 'DELIVERY';
}
