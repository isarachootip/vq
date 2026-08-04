import { parseCoordinatesFromText, formatLatDms, formatLngDms } from '../src/utils/coordinateUtils';

const testCases = [
  '13°51\'07.1"N 100°38\'36.3"E',
  '13°51\'07.1" N, 100°38\'36.3" E',
  'https://www.google.com/maps/@13.851979,100.643406,17z',
  'https://www.google.com/maps/place/13%C2%B051\'07.1%22N+100%C2%B038\'36.3%22E/@13.851979,100.643406,17z',
  '13.851979, 100.643406',
  '13.851979 100.643406',
  'พิกัดลูกค้า 13.851979, 100.643406 หน้าบ้าน',
];

console.log('--- TESTING SMART COORDINATE PARSER ---');
testCases.forEach((tc, idx) => {
  const parsed = parseCoordinatesFromText(tc);
  console.log(`\nTest #${idx + 1}: "${tc}"`);
  if (parsed) {
    console.log(` -> Parsed Lat: ${parsed.lat}, Lng: ${parsed.lng}`);
    console.log(` -> Formatted DMS Lat: ${formatLatDms(parsed.lat)}`);
    console.log(` -> Formatted DMS Lng: ${formatLngDms(parsed.lng)}`);
  } else {
    console.log(' -> FAILED TO PARSE');
  }
});
