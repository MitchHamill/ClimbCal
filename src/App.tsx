import type { IanaTimeZone } from 'types/calendar';
import './App.scss';
import { Temporal } from '@js-temporal/polyfill';
import { useState } from 'react';
import Months from './Months/Months';
import type { FilterState } from 'types/filter';
import EventsView from './EventsView/EventsView';
import Filter from './Filter/Filter';

function App() {
  const [timezone] = useState(() => Temporal.Now.timeZoneId() as IanaTimeZone);
  const [eventFilter, setEventFilter] = useState<FilterState>({
    ageCategories: ['open'],
    disciplines: ['boulder'],
  });
  const [selectedMonth, setSelectedMonth] = useState(() =>
    Temporal.Now.instant().toLocaleString('en-US', { month: 'long' }),
  );

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
