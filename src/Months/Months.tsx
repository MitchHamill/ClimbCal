import './Months.scss';

interface MonthsProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
}

const months = [
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

const Months: React.FC<MonthsProps> = ({ selectedMonth, onMonthSelect }) => {
  return (
    <div id="months">
      <div id="months-container">
        {months.map((month) => (
          <p
            key={month}
            className={'month' + (month === selectedMonth ? ' selected' : '')}
            onClick={() => onMonthSelect(month)}
          >
            {month}
          </p>
        ))}
      </div>
    </div>
  );
};

export default Months;
