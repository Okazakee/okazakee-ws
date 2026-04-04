'use client';

import moment from 'moment';

interface FormattedDateProps {
  date: string | null | undefined;
}

export default function FormattedDate({ date }: FormattedDateProps) {
  const formattedDate = moment(date).format('DD/MM/YYYY');
  return <span>{formattedDate}</span>;
}
