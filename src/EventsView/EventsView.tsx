import type {
  ClimbEvent,
  Discipline,
  IanaTimeZone,
  Round,
} from 'types/calendar';
import './EventsView.scss';
import { Temporal } from '@js-temporal/polyfill';
import { ddMMM, filterEvents, formatDateTime, hhmm } from '../utils';
import calendar from 'calendar';
import { uniq } from 'lodash';
import type { FilterState } from 'types/filter';

interface EventsViewProps {
  timezone: IanaTimeZone;
  filter: FilterState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const EventsView: React.FC<EventsViewProps> = ({ timezone, filter }) => {
  function mapProgram(program: Round[], sourceTimezone: IanaTimeZone) {
    const dayMap = new Map<string, { label: string; rounds: Round[] }>();

    for (const round of program) {
      const sourceDateTime = Temporal.PlainDateTime.from(
        round.start,
      ).toZonedDateTime(sourceTimezone);
      const targetDateTime = sourceDateTime.withTimeZone(timezone);
      const dayKey = targetDateTime.toPlainDate().toString();
      const dayLabel = targetDateTime.toLocaleString('en-US', ddMMM);

      const entry = dayMap.get(dayKey) ?? { label: dayLabel, rounds: [] };
      entry.rounds.push(round);
      dayMap.set(dayKey, entry);
    }

    const sortedDays = Array.from(dayMap.entries()).sort(([a], [b]) => {
      const dateA = Temporal.PlainDate.from(a);
      const dateB = Temporal.PlainDate.from(b);
      return Temporal.PlainDate.compare(dateA, dateB);
    });

    return sortedDays.map(([dayKey, { label, rounds }]) => {
      const sortedRounds = [...rounds].sort((a, b) => {
        const timeA = Temporal.PlainDateTime.from(a.start)
          .toZonedDateTime(sourceTimezone)
          .withTimeZone(timezone);
        const timeB = Temporal.PlainDateTime.from(b.start)
          .toZonedDateTime(sourceTimezone)
          .withTimeZone(timezone);
        return Temporal.ZonedDateTime.compare(timeA, timeB);
      });
      return (
        <div key={dayKey}>
          <h4>{label}</h4>
          {sortedRounds.map((round) => (
            <div key={round.name}>
              <b>
                {formatDateTime(round.start, hhmm, {
                  source: sourceTimezone,
                  target: timezone,
                })}{' '}
                {round.name}
              </b>
            </div>
          ))}
        </div>
      );
    });
  }

  function mapEvent(e: ClimbEvent) {
    const { venue, legs, start, end } = e;
    const unfilteredEvent = calendar.find((ue) => ue.id === e.id);
    const allDisciplines = uniq(
      (unfilteredEvent?.legs || legs)
        .map((leg) => leg.program.map((round) => round.discipline))
        .flat(),
    );

    const startFormatted = formatDateTime(start, ddMMM);
    const endFormatted = formatDateTime(end, ddMMM);

    return (
      <div key={e.id} className="event">
        <h5>
          {startFormatted === endFormatted
            ? startFormatted
            : `${startFormatted} - ${endFormatted}`}
        </h5>
        <h2>
          {venue.city}, {venue.country}
        </h2>
        <i>
          {(['boulder', 'lead', 'speed'] as Discipline[]).every((disc) =>
            allDisciplines.includes(disc),
          )
            ? 'All Disciplines'
            : allDisciplines.join(' // ')}
        </i>
        {legs.map((leg) => (
          <div key={leg.id}>
            <h3>{leg.title}</h3>
            {mapProgram(leg.program, venue.timezone)}
          </div>
        ))}
      </div>
    );
  }
  return <div id="events">{filterEvents(filter).map(mapEvent)}</div>;
};

export default EventsView;
