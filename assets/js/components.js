import { STATUS_LABEL, STATUS_BADGE_DARK, STATUS_BADGE_LIGHT } from './constants.js';

export function getStatusBadge(status, theme = 'light') {
  const badgeMap = theme === 'dark' ? STATUS_BADGE_DARK : STATUS_BADGE_LIGHT;
  const cls = badgeMap[status] || 'bg-gray-100 text-gray-600';
  const label = STATUS_LABEL[status] || status;

  return `
    <span class="${cls} text-xs font-bold px-3 py-1 rounded-full">
      ${label}
    </span>
  `;
}
