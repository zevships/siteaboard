import { useI18n } from '../../lib/reference-format.ts';

export function Zh({ text }: { text: string | null | undefined }) {
  const { locale } = useI18n();
  return locale === 'zh-CN' && text ? <span className="ad-zh"> - {text}</span> : null;
}
