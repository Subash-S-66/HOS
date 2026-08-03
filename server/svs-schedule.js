const DAY = 24 * 60 * 60 * 1000;

// SVS refreshes at the start of every other Monday in New York. This is a
// permanent cadence origin, not a hard-coded "latest" date: the calculation
// advances naturally across months and years whenever the server starts.
const SVS_FIRST_UPDATE = Date.UTC(2026, 7, 3); // Monday, August 3, 2026

const newYorkCalendarDate = (date = new Date()) => {
  const fields = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type) => fields.find((field) => field.type === type).value;
  return Date.UTC(Number(value('year')), Number(value('month')) - 1, Number(value('day')));
};

const isoWeek = (date) => {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return `${value.getUTCFullYear()}-W${String(Math.ceil((((value - yearStart) / DAY) + 1) / 7)).padStart(2, '0')}`;
};

const scheduledSvsHistory = (now = new Date(), length = 10) => {
  const today = newYorkCalendarDate(now);
  if (today < SVS_FIRST_UPDATE) return [];

  const latest = SVS_FIRST_UPDATE + Math.floor((today - SVS_FIRST_UPDATE) / (14 * DAY)) * 14 * DAY;
  return Array.from({ length }, (_, index) => {
    const date = new Date(latest - index * 14 * DAY);
    const week = isoWeek(date);
    return { position: index + 1, date, week, url: `https://svs.info/server/1895/svs/${week}` };
  });
};

module.exports = { SVS_FIRST_UPDATE, isoWeek, scheduledSvsHistory };
