exports.getIndiaDay = (selectedDate) => {
  const date = new Date(selectedDate);

  // Get UTC time in milliseconds
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);

  // IST is UTC+5:30 => 5.5 hours * 60 * 60 * 1000 = 19800000 ms
  const istTime = new Date(utcTime + 19800000);

  const dayIndex = istTime.getDay(); // 0 (Sunday) to 6 (Saturday)
  const dayName = istTime.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });

  return { index: dayIndex, name: dayName };
};
