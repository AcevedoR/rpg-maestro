export function durationInMsToString(durationInMs: number): string{
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
  return `${hoursToDisplay === '00' ? '' : hoursToDisplay+ ':'}${minutesToDisplay}:${secondsToDisplay}`;
}