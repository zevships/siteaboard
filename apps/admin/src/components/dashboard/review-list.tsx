import { usePreferences } from '../../providers/preferences.tsx';
import { Icon } from '../ui/icon.tsx';

const reviews = [
  {
    icon: 'search',
    title: 'issueSearch',
    description: 'issueSearchDetail',
    tag: 'seoTag',
    tone: 'mint',
  },
  {
    icon: 'target',
    title: 'issueTracking',
    description: 'issueTrackingDetail',
    tag: 'trackingTag',
    tone: 'peach',
  },
  {
    icon: 'clock',
    title: 'issueRelease',
    description: 'issueReleaseDetail',
    tag: 'reviewTag',
    tone: 'lavender',
  },
] as const;
export function ReviewList() {
  const { t } = usePreferences();
  return (
    <ol className="review-list">
      {reviews.map((review) => (
        <li key={review.title}>
          <span className={`review-icon ${review.tone}`}>
            <Icon name={review.icon} size={18} />
          </span>
          <div>
            <span className="review-tag">{t(review.tag)}</span>
            <h3>{t(review.title)}</h3>
            <p>{t(review.description)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
