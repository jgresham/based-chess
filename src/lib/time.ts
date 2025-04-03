// make a function which takes a utc timestamp and returns
// a short string of the time since then like "10m ago", "1h ago", "1d ago", "1w ago", "1m ago", "1y ago"

const noAgo = true;

export const timeSince = (timestamp: number) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years}y ${noAgo ? "" : "ago"}`;
  } if (months > 0) {
    return `${months}m ${noAgo ? "" : "ago"}`;
  }
  if (weeks > 0) {
    return `${weeks}w ${noAgo ? "" : "ago"}`;
  }
  if (days > 0) {
    return `${days}d ${noAgo ? "" : "ago"}`;
  }
  if (hours > 0) {
    return `${hours}h ${noAgo ? "" : "ago"}`;
  }
  if (minutes > 0) {
    return `${minutes}m ${noAgo ? "" : "ago"}`;
  }
  return `${seconds}s ${noAgo ? "" : "ago"}`;
};
