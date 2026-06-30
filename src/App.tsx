import type { IanaTimeZone } from 'types/calendar';
import './App.scss';
import { Temporal } from '@js-temporal/polyfill';
import { useMemo, useState } from 'react';
import Months from './Months/Months';
import type { FilterState } from 'types/filter';
import EventsView from './EventsView/EventsView';
import Filter from './Filter/Filter';
import calendar from 'calendar';
import { MONTHS } from './constants';
import { filterEvents, formatDateTime } from './utils';
import { Gear } from './Icons';

function App() {
  const [timezone, setTimezone] = useState(
    () => Temporal.Now.timeZoneId() as IanaTimeZone,
  );
  const [eventFilter, setEventFilter] = useState<FilterState>({});
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const changeSettings: React.SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.target;
    const { selectedTz, showPrev } = Object.fromEntries(
      new FormData(form).entries(),
    ) as {
      selectedTz: IanaTimeZone;
      showPrev?: 'on';
    };
    setTimezone(selectedTz);
    setShowCompleted(!!showPrev);

    setShowSettings(false);
  };

  const events = useMemo(
    () => filterEvents(eventFilter, showCompleted, timezone),
    [eventFilter, showCompleted],
  );

  return (
    <div id="climbcal">
      <div id="config">
        <div id="header">
          <h1>World Climbing Calendar</h1>
          <div className="controls">
            {!showSettings ? (
              <>
                <p>Timezone: {timezone}</p>
                <Gear size="1.5rem" onClick={() => setShowSettings(true)} />
              </>
            ) : (
              <div className="settings">
                <form onSubmit={changeSettings}>
                  <div className="settings-section">
                    <p className="label">Timezone</p>
                    <select defaultValue={timezone} name="selectedTz">
                      {Intl.supportedValuesOf('timeZone').map((tz) => (
                        <option value={tz} key={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings-section">
                    <input
                      type="checkbox"
                      name="showPrev"
                      id="showPrev"
                      defaultChecked={showCompleted}
                    />
                    <p className="label">Show Finished Events</p>
                  </div>
                  <div className="settings-section">
                    <button onClick={() => setShowSettings(false)}>
                      Cancel
                    </button>
                    <button type="submit">Change Settings</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        <Filter setEventFilter={setEventFilter} filterState={eventFilter} />
      </div>
      <div id="calendar">
        <Months
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
          disableMonths={MONTHS.filter(
            (m) =>
              !events.some(
                (e) => formatDateTime(e.start, { month: 'long' }) === m,
              ),
          )}
        />
        <EventsView
          events={events}
          timezone={timezone}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>
      <div id="footer">
        <div id="hd-brief">
          <a href="https://hamill.digital">hamill.digital</a>
        </div>
        <div id="donate">
          <a href="https://buymeacoffee.com/mitchhamill">Buy me a coffee</a>
        </div>
      </div>
    </div>
  );
}

export default App;
