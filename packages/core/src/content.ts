/** Portable content snapshot. No remote media or executable markup is accepted. */
export type ContentText = { zh: string; en: string };
export type ContentCreator = {
  id: string;
  name: string;
  handle: string;
  platform: string;
  categoryId: string;
  topic: 'makers' | 'learning';
  bio: ContentText;
  hue: number;
  followers: number | null;
};
export type ContentPost = {
  id: string;
  creatorId: string;
  date: string;
  title: ContentText;
  body: ContentText;
  categoryId: string;
  art: 'terminal' | 'landscape' | 'shapes' | 'editor' | 'dashboard' | 'type';
  durationSeconds: number | null;
  likes: number | null;
  saved: boolean;
  entityIds: string[];
};
export type ContentEntity = {
  id: string;
  name: string;
  kind: string;
  summary: ContentText;
  relatedIds: string[];
};
export type ContentDataset = {
  schemaVersion: 1;
  collectedAt: string;
  costs: { todayUsd: number | null; monthUsd: number | null; dailyUsd: (number | null)[] };
  categories: { id: string; label: ContentText; color: string }[];
  creators: ContentCreator[];
  posts: ContentPost[];
  entities: ContentEntity[];
  accounts: {
    id: string;
    name: string;
    platform: string;
    handle: string;
    posts: number;
    views: number | null;
    nextAction: ContentText;
  }[];
};
export function validateContent(value: unknown): asserts value is ContentDataset {
  const fail = (): never => {
    throw new Error('Invalid content snapshot');
  };
  const obj = (v: unknown, keys: string[]): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) fail();
    const r = v as Record<string, unknown>;
    if (Object.keys(r).some((k) => !keys.includes(k)) || keys.some((k) => !(k in r))) fail();
    return r;
  };
  const str = (v: unknown, max = 4000): string => {
    if (
      typeof v !== 'string' ||
      !v.length ||
      v.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)
    )
      fail();
    return v as string;
  };
  const id = (v: unknown): string => {
    const s = str(v, 80);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(s)) fail();
    return s;
  };
  const count = (v: unknown, nullable = true) => {
    if (v === null && nullable) return;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1e12) fail();
  };
  const integer = (v: unknown, nullable = true) => {
    count(v, nullable);
    if (v !== null && !Number.isSafeInteger(v)) fail();
  };
  const text = (v: unknown) => {
    const t = obj(v, ['zh', 'en']);
    str(t.zh);
    str(t.en);
  };
  const list = (v: unknown, max = 20000): unknown[] => {
    if (!Array.isArray(v) || v.length > max) fail();
    return v as unknown[];
  };
  const date = (v: unknown) => {
    if (
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(str(v, 20)) ||
      !Number.isFinite(Date.parse(v as string)) ||
      new Date(v as string).toISOString().replace('.000Z', 'Z') !== v
    )
      fail();
  };
  const d = obj(value, [
    'schemaVersion',
    'collectedAt',
    'costs',
    'categories',
    'creators',
    'posts',
    'entities',
    'accounts',
  ]);
  if (d.schemaVersion !== 1) fail();
  date(d.collectedAt);
  const c = obj(d.costs, ['todayUsd', 'monthUsd', 'dailyUsd']);
  count(c.todayUsd);
  count(c.monthUsd);
  list(c.dailyUsd, 31).forEach((v) => count(v));
  const unique = (
    items: unknown[],
    check: (r: Record<string, unknown>) => void,
    keys: string[],
  ) => {
    const ids = new Set<string>();
    for (const item of items) {
      const r = obj(item, keys);
      const key = id(r.id);
      if (ids.has(key)) fail();
      ids.add(key);
      check(r);
    }
    return ids;
  };
  const cats = unique(
    list(d.categories, 100),
    (r) => {
      text(r.label);
      if (!/^#[0-9a-f]{6}$/i.test(str(r.color, 7))) fail();
    },
    ['id', 'label', 'color'],
  );
  const entities = unique(
    list(d.entities),
    (r) => {
      str(r.name, 100);
      str(r.kind, 100);
      text(r.summary);
      list(r.relatedIds, 100).forEach(id);
    },
    ['id', 'name', 'kind', 'summary', 'relatedIds'],
  );
  const creators = unique(
    list(d.creators),
    (r) => {
      str(r.name, 100);
      str(r.handle, 100);
      str(r.platform, 50);
      if (!cats.has(id(r.categoryId)) || !['makers', 'learning'].includes(r.topic as string))
        fail();
      text(r.bio);
      count(r.hue, false);
      if ((r.hue as number) > 360) fail();
      integer(r.followers);
    },
    ['id', 'name', 'handle', 'platform', 'categoryId', 'topic', 'bio', 'hue', 'followers'],
  );
  unique(
    list(d.posts),
    (r) => {
      if (!creators.has(id(r.creatorId)) || !cats.has(id(r.categoryId))) fail();
      date(r.date);
      if ((r.date as string) > (d.collectedAt as string)) fail();
      text(r.title);
      text(r.body);
      if (
        !['terminal', 'landscape', 'shapes', 'editor', 'dashboard', 'type'].includes(
          r.art as string,
        )
      )
        fail();
      integer(r.durationSeconds);
      integer(r.likes);
      if (typeof r.saved !== 'boolean') fail();
      for (const e of list(r.entityIds, 100)) if (!entities.has(id(e))) fail();
    },
    [
      'id',
      'creatorId',
      'date',
      'title',
      'body',
      'categoryId',
      'art',
      'durationSeconds',
      'likes',
      'saved',
      'entityIds',
    ],
  );
  for (const e of d.entities as ContentEntity[])
    for (const rel of e.relatedIds) if (!entities.has(rel)) fail();
  unique(
    list(d.accounts, 100),
    (r) => {
      str(r.name, 100);
      str(r.platform, 50);
      str(r.handle, 100);
      integer(r.posts, false);
      integer(r.views);
      text(r.nextAction);
    },
    ['id', 'name', 'platform', 'handle', 'posts', 'views', 'nextAction'],
  );
}
