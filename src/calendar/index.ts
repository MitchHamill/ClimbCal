import type {
  ClimbEvent,
  Leg,
  Link,
  Round,
  Discipline,
  AgeGroup,
  Ability,
  LocalDateTime,
  IanaTimeZone,
} from 'types/calendar';
import calendarData from './raw.json';

// calendar.json is typed as plain strings/objects by TypeScript, which are
// not assignable to the branded LocalDateTime / IanaTimeZone types, and its
// nested arrays aren't narrowed to our union types. parseCalendar validates
// the shape at runtime and brands the values, so callers receive a real
// ClimbEvent[].

const DISCIPLINES: ReadonlySet<Discipline> = new Set([
  'boulder',
  'lead',
  'speed',
]);
const AGES: ReadonlySet<AgeGroup> = new Set(['open', 'u17', 'u19', 'u21']);
const ABILITIES: ReadonlySet<Ability> = new Set(['open', 'para']);
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

const asLocalDateTime = (v: string, where: string): LocalDateTime => {
  if (!LOCAL_DATE_TIME.test(v))
    throw new Error(`${where}: bad LocalDateTime "${v}"`);
  return v as LocalDateTime;
};

const asTimeZone = (v: string, where: string): IanaTimeZone => {
  // Validate against the runtime's tz database; throws on an unknown zone.
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: v });
  } catch {
    throw new Error(`${where}: unknown IANA time zone "${v}"`);
  }
  return v as IanaTimeZone;
};

const asLink = (l: any, _: string): Link => ({
  displayText: String(l.displayText),
  accessibleText: String(l.accessibleText),
  url: String(l.url),
  openInNewTab: Boolean(l.openInNewTab),
});

function parseRound(r: any, where: string): Round {
  if (!DISCIPLINES.has(r.discipline))
    throw new Error(`${where}: bad discipline "${r.discipline}"`);
  if (!AGES.has(r.age)) throw new Error(`${where}: bad age "${r.age}"`);
  if (!ABILITIES.has(r.ability))
    throw new Error(`${where}: bad ability "${r.ability}"`);
  return {
    discipline: r.discipline,
    name: String(r.name),
    start: asLocalDateTime(r.start, where),
    age: r.age,
    ability: r.ability,
  };
}

function parseLeg(l: any, where: string): Leg {
  if (!Array.isArray(l.links))
    throw new Error(`${where}.links: expected an array`);
  if (!Array.isArray(l.program) || l.program.length === 0)
    throw new Error(`${where}.program: expected a non-empty array`);
  return {
    id: String(l.id),
    title: String(l.title),
    links: l.links.map((link: any, k: number) =>
      asLink(link, `${where}.links[${k}]`),
    ),
    start: asLocalDateTime(l.start, `${where}.start`),
    end: asLocalDateTime(l.end, `${where}.end`),
    program: l.program.map((r: any, j: number) =>
      parseRound(r, `${where}.program[${j}]`),
    ),
  };
}

function parseCalendar(input: unknown): ClimbEvent[] {
  if (!Array.isArray(input)) throw new Error('events: expected an array');
  return input.map((e, i): ClimbEvent => {
    const where = `events[${i}]`;
    if (!Array.isArray(e.legs) || e.legs.length === 0)
      throw new Error(`${where}.legs: expected a non-empty array`);
    return {
      id: String(e.id),
      venue: {
        city: String(e.venue.city),
        country: String(e.venue.country),
        timezone: asTimeZone(e.venue.timezone, `${where}.venue`),
      },
      start: asLocalDateTime(e.start, `${where}.start`),
      end: asLocalDateTime(e.end, `${where}.end`),
      legs: e.legs.map((l: any, k: number) =>
        parseLeg(l, `${where}.legs[${k}]`),
      ),
    };
  });
}

// Parsed once at module load; import this everywhere instead of the raw JSON.
const calendar: ClimbEvent[] = parseCalendar(calendarData);

export default calendar;
