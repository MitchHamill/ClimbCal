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
import { useEffect, useMemo, useRef } from 'react';

interface EventsViewProps {
  timezone: IanaTimeZone;
  filter: FilterState;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const EventsView: React.FC<EventsViewProps> = ({
  timezone,
  filter,
  selectedMonth,
  onMonthChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const monthHeadingRefs = useRef<Record<string, HTMLHeadingElement | null>>(
    {},
  );
  const skipScrollRef = useRef(false);

  const monthOrder = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const eventGroupsByMonth = useMemo(() => {
    const groups = new Map<string, ClimbEvent[]>();

    for (const event of filterEvents(filter)) {
      const month = Temporal.PlainDateTime.from(event.start)
        .toZonedDateTime(timezone)
        .toLocaleString('en-US', { month: 'long' });
      const entry = groups.get(month) ?? [];
      entry.push(event);
      groups.set(month, entry);
    }

    return Array.from(groups.entries()).sort(([aMonth], [bMonth]) => {
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
  }, [filter, timezone]);

  useEffect(() => {
    const target = monthRefs.current[selectedMonth];
    if (!target || !containerRef.current) return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedMonth, eventGroupsByMonth]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry?.target) return;

        const month = (visibleEntry.target as HTMLElement).dataset.month;
        if (month && month !== selectedMonth) {
          skipScrollRef.current = true;
          onMonthChange(month);
        }
      },
      {
        root,
        rootMargin: '-50% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75],
      },
    );

    Object.values(monthHeadingRefs.current).forEach((heading) => {
      if (heading) observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [onMonthChange, selectedMonth, eventGroupsByMonth]);

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
          {sortedRounds.map(({ name, start, age }) => (
            <div key={[name, start, age].join('-')}>
              <b>
                {formatDateTime(start, hhmm, {
                  source: sourceTimezone,
                  target: timezone,
                })}{' '}
                {name}
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

  if (eventGroupsByMonth.length === 0) {
    return <div id="events">No events match the current filter.</div>;
  }

  return (
    <div id="events" ref={containerRef}>
      {eventGroupsByMonth.map(([month, events]) => (
        <section
          key={month}
          ref={(section) => {
            monthRefs.current[month] = section as HTMLDivElement | null;
          }}
          data-month={month}
        >
          <h3
            ref={(heading) => {
              monthHeadingRefs.current[month] = heading;
            }}
            data-month={month}
          >
            {month}
          </h3>
          {events.map(mapEvent)}
        </section>
      ))}
    </div>
  );
};

export default EventsView;
