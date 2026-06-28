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
import { MONTHS } from '../constants';

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
  const skipScrollRef = useRef(false);
  const lastVisibleMonthRef = useRef<string | null>(null);
  const isTickingRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<number | null>(null);

  const eventGroupsByMonth = useMemo(() => {
    const groups = new Map<string, ClimbEvent[]>();

    for (const event of filterEvents(filter, false, timezone)) {
      const month = Temporal.PlainDateTime.from(event.start)
        .toZonedDateTime(timezone)
        .toLocaleString('en-US', { month: 'long' });
      const entry = groups.get(month) ?? [];
      entry.push(event);
      groups.set(month, entry);
    }

    return Array.from(groups.entries()).sort(([aMonth], [bMonth]) => {
      return MONTHS.indexOf(aMonth) - MONTHS.indexOf(bMonth);
    });
  }, [filter, timezone]);

  function getTopVisibleMonth() {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    let nextMonthBelowTop: string | undefined;

    for (const [month] of eventGroupsByMonth) {
      const section = monthRefs.current[month];
      if (!section) continue;
      const rect = section.getBoundingClientRect();

      if (rect.top <= containerRect.top && rect.bottom > containerRect.top) {
        return month;
      }

      if (rect.top > containerRect.top && nextMonthBelowTop === undefined) {
        nextMonthBelowTop = month;
      }
    }

    return nextMonthBelowTop;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (programmaticScrollRef.current || isTickingRef.current) return;
      isTickingRef.current = true;

      window.requestAnimationFrame(() => {
        const month = getTopVisibleMonth();
        if (month && month !== lastVisibleMonthRef.current) {
          lastVisibleMonthRef.current = month;
          if (month !== selectedMonth) {
            skipScrollRef.current = true;
            onMonthChange(month);
          }
        }
        isTickingRef.current = false;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [selectedMonth, onMonthChange, eventGroupsByMonth]);

  useEffect(() => {
    const target = monthRefs.current[selectedMonth];
    if (!target || !containerRef.current) return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }

    programmaticScrollRef.current = true;
    lastVisibleMonthRef.current = selectedMonth;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (programmaticScrollTimeoutRef.current) {
      window.clearTimeout(programmaticScrollTimeoutRef.current);
    }
    programmaticScrollTimeoutRef.current = window.setTimeout(() => {
      programmaticScrollRef.current = false;
      programmaticScrollTimeoutRef.current = null;
    }, 1200);
  }, [selectedMonth, eventGroupsByMonth]);

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
    const { venue, legs } = e;
    const unfilteredEvent = calendar.find((ue) => ue.id === e.id);

    return legs.map((leg) => {
      const { start, end } = leg;
      const startFormatted = formatDateTime(start, ddMMM);
      const endFormatted = formatDateTime(end, ddMMM);

      const unfilteredLeg = unfilteredEvent?.legs.find((ul) => ul.id === e.id);
      const allDisciplines = uniq(
        (unfilteredLeg || leg).program.map((round) => round.discipline).flat(),
      );
      return (
        <details key={leg.id}>
          <summary>
            <div className="leg-summary">
              <div className="leg-details">
                <h5>
                  {startFormatted === endFormatted
                    ? startFormatted
                    : `${startFormatted} - ${endFormatted}`}{' '}
                  // {venue.city}, {venue.country}
                </h5>
                <h3>{leg.title}</h3>
                <h5>
                  {(['boulder', 'lead', 'speed'] as Discipline[]).every(
                    (disc) => allDisciplines.includes(disc),
                  )
                    ? 'All Disciplines'
                    : allDisciplines.join(' // ')}
                </h5>
              </div>
              <img className="leg-chevron" src="chevron-down.svg" />
            </div>
          </summary>

          <div className="body">{mapProgram(leg.program, venue.timezone)}</div>
        </details>
      );
    });
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
          className="month"
        >
          {events.map(mapEvent)}
        </section>
      ))}
    </div>
  );
};

export default EventsView;
