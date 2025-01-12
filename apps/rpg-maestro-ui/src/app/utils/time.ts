export function durationInMsToString(durationInMs: number): string {
  const sec_num = parseInt(Number(durationInMs / 1000).toString(), 10); // don't forget the second param
  const hours = Math.floor(sec_num / 3600);
  const minutes = Math.floor((sec_num - hours * 3600) / 60);
  const seconds = sec_num - hours * 3600 - minutes * 60;
  let hoursToDisplay = Number(hours).toString();
  let minutesToDisplay = Number(minutes).toString();
  let secondsToDisplay = Number(seconds).toString();
  if (hours < 10) {
    hoursToDisplay = '0' + hours;
  }
  if (minutes < 10) {
    minutesToDisplay = '0' + minutes;
  }
  if (seconds < 10) {
    secondsToDisplay = '0' + seconds;
  }
  return `${hoursToDisplay === '00' ? '' : hoursToDisplay + ':'}${minutesToDisplay}:${secondsToDisplay}`;
}

export function formatTodayDate(
  timestampToFormat: number,
  overrideDefaultLocale?: Intl.Locale,
  overrideCurrentDate?: Date
): string {
  const locale = overrideDefaultLocale ? overrideDefaultLocale : 'default';
  const currentDate = overrideCurrentDate ? overrideCurrentDate.valueOf() : Date.now();

  if (currentDate - timestampToFormat > 1000 * 60 * 60 * 12) {
    return new Date(timestampToFormat).toLocaleString(locale, { day: 'numeric', month: 'short' });
  } else {
    return new Date(timestampToFormat).toLocaleString(locale, { hour: 'numeric', minute: 'numeric' });
  }
}

export function formatTime(
  timestampToFormat: number,
  overrideDefaultLocale?: Intl.Locale,
  overrideCurrentDate?: Date
): string {
  const locale = overrideDefaultLocale ? overrideDefaultLocale : 'default';

  if (timestampToFormat >= 1000 * 60 * 60) {
    return new Date(timestampToFormat).toLocaleString(locale, { hour: 'numeric', minute: 'numeric' });
  } else if (timestampToFormat >= 1000 * 60) {
    return new Date(timestampToFormat).toLocaleString(locale, { minute: 'numeric', second: 'numeric' });
  } else {
    return new Date(timestampToFormat).toLocaleString(locale, { second: 'numeric' }) + 's';
  }
}
