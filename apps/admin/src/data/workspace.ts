import { shiftDate } from '../../../../packages/core/src/workspace.ts';
import type {
  Count,
  DailyMetrics,
  DimensionKey,
  LocalizedText,
  SiteDataset,
  WorkspaceDataset,
} from '../../../../packages/core/src/workspace.ts';

const text = (en: string, zh: string): LocalizedText => ({ en, zh });
const today = '2026-10-24';
const through = '2026-10-23';
const generatedAt = '2026-10-24T17:30:00Z';
const eventNames = [
  text('Open editor', '打开编辑器'),
  text('Start export', '开始导出'),
  text('Finish export', '完成导出'),
  text('Download', '下载'),
];
// Partitioning uses integer remainders: every dimension and source agrees with its day.
function partition(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let used = 0;
  return weights.map((weight, i) => {
    const value = i === weights.length - 1 ? total - used : Math.floor((total * weight) / sum);
    used += value;
    return value;
  });
}
const dimensions: Record<DimensionKey, string[]> = {
  source: ['Google', 'Bing', 'Direct', 'Community', 'AI assistants'],
  page: ['/', '/editor', '/guides/export', '/pricing'],
  country: ['United States', 'Germany', 'Japan', 'Brazil'],
  region: ['California', 'Berlin', 'Tokyo', 'São Paulo'],
  city: ['San Francisco', 'Berlin', 'Tokyo', 'São Paulo'],
  device: ['Desktop', 'Mobile', 'Tablet'],
  browser: ['Chrome', 'Safari', 'Firefox', 'Edge'],
  os: ['Windows', 'macOS', 'Android', 'iOS', 'Linux'],
};
function createSite(
  id: string,
  name: string,
  kind: SiteDataset['kind'],
  seed: number,
): SiteDataset {
  const daily: DailyMetrics[] = Array.from({ length: 84 }, (_, index) => {
    const visitors = 160 + seed * 81 + index * (seed + 2) + ((index * 19 + seed * 7) % 83);
    const goals = Math.floor(visitors * (0.16 + seed * 0.017));
    return {
      date: shiftDate(through, index - 83),
      visitors,
      visits: visitors + Math.floor(visitors * 0.18),
      pageviews: Math.floor(visitors * 2.12),
      opens: Math.floor(visitors * 0.78),
      starts: Math.floor(visitors * 0.61),
      completions: Math.floor(visitors * 0.43),
      goals,
      googleClicks: Math.floor(visitors * 0.11),
      bingClicks: Math.floor(visitors * 0.08),
      bounces: Math.floor(visitors * 0.27),
      durationSeconds: visitors * (73 + seed * 5),
    };
  });
  const hourlyYesterday = partition(
    daily.at(-1)!.visitors!,
    Array.from({ length: 24 }, (_, h) => 5 + ((h * 7) % 15)),
  );
  const hourlyYesterdayGoals = partition(
    daily.at(-1)!.goals!,
    Array.from({ length: 24 }, (_, h) => 5 + ((h * 7) % 15)),
  );
  const hourlyToday: Count[] = hourlyYesterday.map((value, h) =>
    h > 17 ? null : value + (h % 3) + seed,
  );
  const hourlyTodayGoals: Count[] = hourlyYesterdayGoals.map((value, h) =>
    h > 17 ? null : value + (h % 4 === 0 ? 1 : 0),
  );
  // The current hour is a same-minute comparison bucket (17:00–17:30).
  hourlyYesterday[17] = Math.floor(hourlyYesterday[17] / 2);
  hourlyYesterdayGoals[17] = Math.floor(hourlyYesterdayGoals[17] / 2);
  hourlyToday[17] = Math.floor(hourlyToday[17]! / 2);
  hourlyTodayGoals[17] = Math.floor(hourlyTodayGoals[17]! / 2);
  const issues: SiteDataset['issues'] = [
    {
      id: 'I1',
      title: text('Mobile export needs a clearer recovery path', '移动端导出需要更清晰的恢复提示'),
      description: text(
        'The synthetic mobile scenario stops when the tab goes into the background.',
        '合成移动端场景在标签页切到后台后停止。',
      ),
      status: 'open',
      priority: 'high',
      kind: 'bug',
      createdAt: '2026-10-20',
      reviewAt: '2026-10-24',
      releaseId: null,
      relatedIds: ['I3'],
      evidence: text(
        'Example: three fabricated feedback entries describe the same recovery step.',
        '示例：三条虚构反馈描述了同一个恢复步骤。',
      ),
    },
    {
      id: 'I2',
      title: text('Review the new search landing page', '复查新的搜索落地页'),
      description: text(
        'Compare a full week before and after the guide update; source mix may change.',
        '对比指南更新前后完整一周；注意来源构成可能变化。',
      ),
      status: 'review',
      priority: 'medium',
      kind: 'improvement',
      createdAt: '2026-10-14',
      reviewAt: '2026-10-24',
      releaseId: 'R2',
      relatedIds: [],
      evidence: text(
        'Synthetic search clicks and the release marker are available in this workspace.',
        '工作区提供合成搜索点击与发版标记。',
      ),
    },
    {
      id: 'I3',
      title: text('Choose when to show the export size estimate', '决定何时显示导出体积估算'),
      description: text(
        'Show an estimate before the user starts an export.',
        '在用户开始导出前显示估算值。',
      ),
      status: 'open',
      priority: 'medium',
      kind: 'decision',
      createdAt: '2026-10-21',
      reviewAt: null,
      releaseId: null,
      relatedIds: ['I1'],
      evidence: text(
        'Illustrative decision; no real users or experiments are represented.',
        '演示决策，不代表真实用户或实验。',
      ),
    },
    {
      id: 'I4',
      title: text('Make keyboard focus visible on the toolbar', '让工具栏键盘焦点清晰可见'),
      description: text(
        'The editor toolbar now has visible focus outlines.',
        '编辑器工具栏已增加可见焦点轮廓。',
      ),
      status: 'resolved',
      priority: 'low',
      kind: 'bug',
      createdAt: '2026-10-08',
      reviewAt: null,
      releaseId: 'R1',
      relatedIds: [],
      evidence: text(
        'Synthetic release acceptance: all toolbar buttons can be reached with Tab.',
        '合成发版验收：所有工具栏按钮均可通过 Tab 到达。',
      ),
    },
  ];
  return {
    id,
    name,
    domain: `${id}.example`,
    kind,
    time: { today, dataThrough: through, hour: 17, timezone: 'UTC', fetchedAt: generatedAt },
    provenance: {
      source: 'synthetic-fixture-v1',
      quality: 'demo',
      definitionVersion: '1',
      visitorDefinition: 'daily-unique-persondays',
      funnelDefinition: 'independent-event-counts',
    },
    notes: [
      text(
        'Fictional data only. Dates are frozen at 24 October 2026; this is not a live measurement.',
        '全部为虚构演示数据。时间固定为 2026 年 10 月 24 日，不是实时测量。',
      ),
      text(
        'Visitors are daily unique counts. Multi-day totals are person-days, not deduplicated people.',
        '访客按天去重。跨日合计是人次天数，不是跨日去重人数。',
      ),
      text(
        'Steps count independent daily event participants; ratios describe volume, not verified user conversion.',
        '步骤按天统计独立事件参与者；比例描述数量关系，不代表已验证的用户转化率。',
      ),
      text(
        'Today compares first-seen hourly visitors and downloads with yesterday at the same cutoff. Future hours are missing, not zero.',
        '今天按同一截止小时对比首次出现的访客与下载。未来小时为缺失，不是零。',
      ),
    ],
    daily,
    hourly: {
      today: hourlyToday,
      yesterday: hourlyYesterday,
      todayGoals: hourlyTodayGoals,
      yesterdayGoals: hourlyYesterdayGoals,
    },
    events: daily.flatMap((row) =>
      (['opens', 'starts', 'completions', 'goals'] as const).map((event, i) => ({
        date: row.date,
        event,
        name: eventNames[i],
        visitors: row[event],
        events: row[event]! + Math.floor(row[event]! * (0.08 + i * 0.02)),
      })),
    ),
    breakdowns: daily.flatMap((row) =>
      (Object.entries(dimensions) as [DimensionKey, string[]][]).flatMap(([dimension, names]) => {
        const weights = names.map((_, i) => names.length - i + (i === 0 ? 2 : 0));
        const values = {
          visitors: partition(row.visitors!, weights),
          opens: partition(row.opens!, weights),
          starts: partition(row.starts!, weights),
          completions: partition(row.completions!, weights),
          goals: partition(row.goals!, weights),
        };
        return names.map((name, i) => ({
          date: row.date,
          dimension,
          name,
          visitors: values.visitors[i],
          opens: values.opens[i],
          starts: values.starts[i],
          completions: values.completions[i],
          goals: values.goals[i],
        }));
      }),
    ),
    performance: daily.flatMap((row, index) =>
      (['/', '/editor'] as const).flatMap((path, p) =>
        (['desktop', 'mobile'] as const).map((device, d) => ({
          date: row.date,
          path,
          device,
          samples: Math.floor(row.visits! / 5),
          lcp: 1100 + d * 1050 + p * 190 + (index % 7) * 35,
          inp: 80 + d * 70 + p * 24 + (index % 5) * 9,
          cls: Math.round((0.02 + d * 0.03 + p * 0.01 + (index % 3) * 0.005) * 1000) / 1000,
          errors: d && p && index % 6 === 0 ? 3 : 0,
          error: d && p && index % 6 === 0 ? 'Synthetic export interrupted' : null,
        })),
      ),
    ),
    feedback: [
      {
        id: 'F1',
        date: '2026-10-23',
        kind: 'bug',
        text: text(
          'The example export stops when I switch tabs on my phone.',
          '示例导出在手机切换标签页后停止了。',
        ),
        page: '/editor',
        device: 'Mobile · Safari',
        status: 'reviewing',
        issueId: 'I1',
        rating: 'worse',
        followup: text(
          'Try keeping the editor visible until export finishes.',
          '可先保持编辑器在前台，直到导出完成。',
        ),
      },
      {
        id: 'F2',
        date: '2026-10-22',
        kind: 'idea',
        text: text(
          'Could I see the estimated file size before exporting?',
          '能否在导出前看到预计文件体积？',
        ),
        page: '/editor',
        device: 'Desktop · Chrome',
        status: 'new',
        issueId: 'I3',
        rating: 'some',
        followup: null,
      },
      {
        id: 'F3',
        date: '2026-10-21',
        kind: 'praise',
        text: text('The sample guide made my first export easy.', '示例指南让第一次导出更容易了。'),
        page: '/guides/export',
        device: 'Desktop · Firefox',
        status: 'resolved',
        issueId: null,
        rating: 'much',
        followup: text('Thanks for trying this fictional demonstration.', '感谢体验这份虚构演示。'),
      },
      {
        id: 'F4',
        date: '2026-10-19',
        kind: 'bug',
        text: text(
          'The sample has a small layout shift on mobile.',
          '示例在移动端出现了一点布局位移。',
        ),
        page: '/',
        device: 'Mobile · Chrome',
        status: 'new',
        issueId: null,
        rating: 'same',
        followup: null,
      },
      {
        id: 'F5',
        date: '2026-10-07',
        kind: 'idea',
        text: text('Keyboard shortcuts would help in the editor.', '编辑器增加快捷键会更方便。'),
        page: '/editor',
        device: 'Desktop · Safari',
        status: 'resolved',
        issueId: 'I4',
        rating: null,
        followup: null,
      },
    ],
    returning: daily.map((row) => {
      const returningVisitors = Math.floor(row.visitors! * 0.22);
      const newVisitors = row.visitors! - returningVisitors;
      const bands = partition(returningVisitors, [6, 3, 1]);
      const returningGoals = Math.floor(row.goals! * 0.31);
      return {
        date: row.date,
        newVisitors,
        returningVisitors,
        sameDayReturns: Math.floor(newVisitors * 0.09),
        days1to7: bands[0],
        days8to30: bands[1],
        days31plus: bands[2],
        newGoals: row.goals! - returningGoals,
        returningGoals,
      };
    }),
    search: daily.flatMap((row, index) =>
      (['google', 'bing'] as const).flatMap((engine) => {
        const clicks = partition(
          row[engine === 'google' ? 'googleClicks' : 'bingClicks']!,
          [5, 3, 2],
        );
        return [`${name.toLowerCase()} editor`, 'browser export tool', 'export guide'].map(
          (query, i) => ({
            date: row.date,
            engine,
            query,
            page: ['/', '/editor', '/guides/export'][i],
            country: ['United States', 'Germany', 'Japan'][i],
            device: i === 1 ? ('mobile' as const) : ('desktop' as const),
            clicks: clicks[i],
            impressions: clicks[i] * (12 + i * 4),
            position: Math.round((4 + i * 3 + (index % 7) * 0.15 + seed * 0.2) * 100) / 100,
            indexed: true,
          }),
        );
      }),
    ),
    issues,
    releases: [
      {
        id: 'R1',
        date: '2026-10-12',
        version: 'v0.4.1',
        title: text('Keyboard navigation polish', '完善键盘操作'),
        description: text(
          'A synthetic accessibility release for the editor toolbar.',
          '编辑器工具栏的一次合成无障碍改进。',
        ),
        issueIds: ['I4'],
        changes: [
          text('Visible focus rings', '可见焦点轮廓'),
          text('Predictable tab order', '可预期的 Tab 顺序'),
        ],
      },
      {
        id: 'R2',
        date: '2026-10-18',
        version: 'v0.5.0',
        title: text('A clearer first export', '更清晰的首次导出体验'),
        description: text(
          'A fictional onboarding update. Before/after counts do not establish causation.',
          '虚构的新手引导更新。前后数据对比不能证明因果关系。',
        ),
        issueIds: ['I2'],
        changes: [
          text('New export guide', '新增导出指南'),
          text('Improved progress labels', '改进进度说明'),
        ],
      },
    ],
  };
}
export const demoWorkspace: WorkspaceDataset = {
  schemaVersion: 1,
  generatedAt,
  source: 'synthetic',
  sites: [
    createSite('tinycanvas', 'TinyCanvas', 'tool', 1),
    createSite('fieldnotes', 'Fieldnotes', 'content', 2),
    createSite('orbitkit', 'OrbitKit', 'saas', 3),
  ],
  tasks: [
    {
      id: 'traffic',
      siteId: 'tinycanvas',
      name: text('Site traffic', '站点访问统计'),
      status: 'success',
      lastRun: '2026-10-24T17:20:00Z',
      nextRun: '2026-10-24T17:35:00Z',
      schedule: text('Every 15 minutes · demonstration', '每 15 分钟 · 演示计划'),
      progress: null,
      coverage: { from: '2026-08-01', to: through, completed: 84, expected: 84 },
    },
    {
      id: 'search',
      siteId: 'fieldnotes',
      name: text('Search reports', '搜索报告'),
      status: 'running',
      lastRun: '2026-10-24T17:29:00Z',
      nextRun: '2026-10-25T09:00:00Z',
      schedule: text('Daily at 09:00 UTC · demonstration', '每天 UTC 09:00 · 演示计划'),
      progress: 0.64,
      coverage: { from: '2026-08-01', to: through, completed: 82, expected: 84 },
    },
    {
      id: 'health',
      siteId: 'orbitkit',
      name: text('Website health', '站点健康检查'),
      status: 'failed',
      lastRun: '2026-10-24T17:15:00Z',
      nextRun: '2026-10-24T17:45:00Z',
      schedule: text('Every 30 minutes · demonstration', '每 30 分钟 · 演示计划'),
      progress: null,
      coverage: { from: '2026-08-01', to: through, completed: 81, expected: 84 },
    },
    {
      id: 'feedback',
      siteId: 'tinycanvas',
      name: text('Feedback inbox', '用户反馈收件箱'),
      status: 'paused',
      lastRun: '2026-10-23T16:00:00Z',
      nextRun: null,
      schedule: text('Manual only · demonstration', '仅手动 · 演示计划'),
      progress: null,
      coverage: { from: '2026-08-01', to: through, completed: 84, expected: 84 },
    },
  ].map((task, taskIndex) => ({
    ...task,
    status: task.status as WorkspaceDataset['tasks'][number]['status'],
    runs: Array.from({ length: 18 }, (_, index) => ({
      at:
        index === 0
          ? task.lastRun
          : new Date(Date.parse(task.lastRun) - index * 3_600_000)
              .toISOString()
              .replace('.000Z', 'Z'),
      status: taskIndex === 2 && index < 2 ? ('failed' as const) : ('success' as const),
      durationSeconds: 2 + ((index * 7 + taskIndex) % 25),
      message:
        taskIndex === 2 && index < 2
          ? text(
              'Synthetic timeout: no external request was made.',
              '合成超时：没有执行任何外部请求。',
            )
          : text('Synthetic snapshot checked successfully.', '合成快照检查成功。'),
    })).reverse(),
  })),
};
