import { MONTHS } from '../constants';
import './Months.scss';

interface MonthsProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
  disableMonths?: string[];
}

const Months: React.FC<MonthsProps> = ({
  selectedMonth,
  onMonthSelect,
  disableMonths,
}) => {
  const monthDisabled = (month: string) =>
    (disableMonths || []).includes(month);
  return (
    <div id="months">
      <div id="months-container">
        {MONTHS.map((month) => (
          <p
            key={month}
            className={
              'month' +
              (month === selectedMonth ? ' selected' : '') +
              (monthDisabled(month) ? ' disabled' : '')
            }
            onClick={() => !monthDisabled(month) && onMonthSelect(month)}
          >
            {month}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Months;
