import { Temporal } from '@js-temporal/polyfill';
import type {
  ClimbEvent,
  IanaTimeZone,
  LocalDateTime,
  Round,
  Leg,
} from 'types/calendar';
import type { FilterState } from 'types/filter';
import calendar from 'calendar';

export const ddMMM: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
};
export const hhmm: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateTime(
  dateTime: LocalDateTime | Temporal.ZonedDateTime,
  options?: Intl.DateTimeFormatOptions,
  timezones?: { source: IanaTimeZone; target: IanaTimeZone },
) {
  let mappedDateTime: Temporal.PlainDateTime | Temporal.ZonedDateTime =
    Temporal.PlainDateTime.from(dateTime);

  if (timezones) {
    const sourceZonedDateTime = mappedDateTime.toZonedDateTime(
      timezones.source,
    );
    mappedDateTime = sourceZonedDateTime.withTimeZone(timezones.target);
  }

  return mappedDateTime.toLocaleString(
    'en-US',
    options ?? { dateStyle: 'medium', timeStyle: 'short' },
  );
}

export function filterRounds(rounds: Round[], filter: FilterState) {
  return rounds.filter((round) => {
    if (filter.abilities && !filter.abilities.includes(round.ability))
      return false;
    if (filter.ageGroups && !filter.ageGroups.includes(round.age)) return false;
    if (filter.disciplines && !filter.disciplines.includes(round.discipline))
      return false;
    return round;
  });
}
export function filterLegs(
  legs: Leg[],
  filter: FilterState,
  showCompleted: boolean,
  timezones: { venue: IanaTimeZone; user: IanaTimeZone },
) {
  return legs
    .map((leg) => {
      if (showCompleted === false) {
        const endLocal = Temporal.PlainDateTime.from(leg.end)
          .toZonedDateTime(timezones.venue)
          .withTimeZone(timezones.user)
          .toInstant();
        const nowLocal = Temporal.Now.instant();

        if (Temporal.Instant.compare(endLocal, nowLocal) < 0) return false;
      }
      const filteredProgram = filterRounds(leg.program, filter);
      if (!filteredProgram.length) return false;

      return {
        ...leg,
        program: filteredProgram,
      };
    })
    .filter((l): l is Leg => !!l);
}
export function filterEvents(
  filter: FilterState,
  showCompleted: boolean,
  timezone: IanaTimeZone,
) {
  return calendar
    .map((event) => {
      const filteredLegs = filterLegs(event.legs, filter, showCompleted, {
        venue: event.venue.timezone,
        user: timezone,
      });

      if (!filteredLegs.length) return false;

      return {
        ...event,
        legs: filteredLegs,
      };
    })
    .filter((e): e is ClimbEvent => !!e);
}
