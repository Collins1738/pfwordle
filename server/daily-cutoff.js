const DAILY_TIME_ZONE = "America/New_York";
const FRIDAY_CUTOFF_HOUR = 16;

function getETClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DAILY_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = type => parts.find(part => part.type === type)?.value;
  return {
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    second: Number(value("second")),
  };
}

function getDailyAvailability(date = new Date()) {
  const clock = getETClock(date);
  const secondsSinceMidnight = clock.hour * 3600 + clock.minute * 60 + clock.second;
  const isFriday = clock.weekday === "Fri";
  const cutoffSeconds = (isFriday ? FRIDAY_CUTOFF_HOUR : 24) * 3600;
  const secondsRemaining = Math.max(0, cutoffSeconds - secondsSinceMidnight);

  return {
    isOpen: secondsRemaining > 0,
    isFriday,
    secondsRemaining,
    cutoffLabel: isFriday ? "4:00 PM ET" : "11:59 PM ET",
  };
}

function dailyClosedResponse(res) {
  return res.status(403).json({
    code: "DAILY_CLOSED",
    error: "Friday's daily closed at 4:00 PM ET. Practice mode is still open!",
  });
}

module.exports = {
  DAILY_TIME_ZONE,
  FRIDAY_CUTOFF_HOUR,
  getETClock,
  getDailyAvailability,
  dailyClosedResponse,
};
