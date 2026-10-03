const STATE_META = {
  ok: { color: 'green', label: '正常滑翔' },
  landed: { color: 'blue', label: '成功着陆' },
  hard_landing: { color: 'orange', label: '重着陆（触地过快）' },
  'crashed(roll)': { color: 'red', label: '横滚失控坠毁' },
  'stalled/slow': { color: 'orange', label: '失速下坠' },
  timedout: { color: 'default', label: '超时结束' },
};

export const STATE_TIPS = {
  ok: '滑翔机在设定时间内稳定飞行，气动布局比较合适，可以试试更高更远的目标。',
  landed: '飞机平稳落地，这是一次成功的试飞！',
  hard_landing: '飞机下降太快，重重地“砸”在了地面上。试试把平尾偏角调小一些，或增大机翼、减轻重量。',
  'crashed(roll)': '飞机发生了横滚失控。试试增大机翼上反角、把重心往前移，或适当提高投放速度。',
  'stalled/slow': '飞机失速下坠了。试试把重心往前移一些、减小平尾上抬角度，或提高一点投放速度。',
  timedout: '在设定时间内飞行稳定、没有落地。',
};

export function stateMeta(state) {
  return STATE_META[state] || { color: 'default', label: state || '—' };
}

export const flightParameters = [
  { name: 'dihedral', field: 'dihedral_deg', title: '机翼上反角', label: '机翼上反角（°）', unit: '°', initial: 5, min: 0, max: 15, step: 0.5, required: true, extra: '两翼尖向上翘起的角度。上反角越大，横滚方向越稳定，飞机越不容易侧翻。' },
  { name: 'cg', field: 'cg_x', title: '重心前移量', label: '重心位置（m，沿机头方向前移量）', unit: 'm', initial: 0, min: -1.5, max: 1.5, step: 0.1, required: true, extra: '重心越靠前，飞机越“头重”、越稳定，但滑翔性能下降；重心太靠后则容易失速翻滚。' },
  { name: 'speed', field: 'speed', title: '初始速度', label: '初始投放速度（m/s）', unit: 'm/s', initial: 36, min: 15, max: 60, step: 1, required: true, extra: '从 150 米高空投放时的初始空速。速度太低可能失速，太高则阻力增加。' },
  { name: 'wing_area', field: 'wing_area', title: '机翼面积', label: '机翼面积（m²）', unit: 'm²', initial: 17.5, min: 10, max: 30, step: 0.5, extra: '越大升力越大、飞得越慢越久。' },
  { name: 'mass', field: 'mass', title: '整机质量', label: '整机质量（kg）', unit: 'kg', initial: 420, min: 250, max: 700, step: 10, extra: '越重飞得越快、下沉越快。' },
  { name: 'elevator', field: 'elevator_deg', title: '水平尾翼偏角', label: '水平尾翼偏角（°）', unit: '°', initial: 0, min: -15, max: 15, step: 0.5, extra: '正值上抬（抬头）· 负值下压（俯冲）；角度太大会失速。' },
  { name: 'rudder', field: 'rudder_deg', title: '垂直尾翼偏角', label: '垂直尾翼偏角（°）', unit: '°', initial: 0, min: -15, max: 15, step: 0.5, extra: '正值机头右偏 · 负值左偏，飞机会转弯。' },
];
export const initialFlightParameters = Object.fromEntries(flightParameters.map((parameter) => [parameter.name, parameter.initial]));
export function flightMetrics(record) {
  return [
    ['滑翔时长', record.glide_time_s, 's'], ['水平距离', record.result?.distance_m, 'm'],
    ['升阻比 L/D', record.result?.glide_ratio, ''], ['平均下沉率', record.result?.mean_sink_mps, 'm/s'],
    ['平均空速', record.result?.mean_speed_mps, 'm/s'], ['落地高度', record.result?.alt_end, 'm'],
  ].map(([label, value, unit]) => ({ label, value: value ?? '—', unit }));
}
