import type { IanaTimeZone } from 'types/calendar';
import './App.scss';
import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';
import Months from './Months/Months';
import type { FilterState } from 'types/filter';
import EventsView from './EventsView/EventsView';
import Filter from './Filter/Filter';
import calendar from 'calendar';
import { MONTHS } from './constants';
import { formatDateTime } from './utils';

function App() {
  const [timezone] = useState(() => Temporal.Now.timeZoneId() as IanaTimeZone);
  const [eventFilter, setEventFilter] = useState<FilterState>({
    ageCategories: ['open'],
    disciplines: ['boulder'],
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = Temporal.Now.instant();

    const nextOrOngoingEvent = calendar
      .map((event) => {
        const startInstant = Temporal.PlainDateTime.from(event.start)
          .toZonedDateTime(event.venue.timezone)
          .toInstant();
        const endInstant = Temporal.PlainDateTime.from(event.end)
          .toZonedDateTime(event.venue.timezone)
          .toInstant();
        return { event, startInstant, endInstant };
      })
      .filter(
        ({ endInstant }) =>
          endInstant.epochMilliseconds > now.epochMilliseconds,
      )
      .sort((a, b) =>
        Temporal.Instant.compare(a.startInstant, b.startInstant),
      )[0];

    const referenceInstant = nextOrOngoingEvent?.startInstant ?? now;

    return referenceInstant
      .toZonedDateTimeISO(timezone)
      .toLocaleString('en-US', {
        month: 'long',
      });
  });

  return (
    <div id="climbcal">
      <div id="header">
        <h1>Climb Calendar</h1>
        <p>Timezone: {timezone}</p>
      </div>
      <div id="main-content">
        <Filter setEventFilter={setEventFilter} />
        <div id="calendar">
          <Months
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            disableMonths={MONTHS.filter(
              (m) =>
                !calendar.some(
                  (e) => formatDateTime(e.start, { month: 'long' }) === m,
                ),
            )}
          />
          <EventsView
            filter={eventFilter}
            timezone={timezone}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
