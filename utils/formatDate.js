// utils/formatDate.js
export const formatDate = (date) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('fr-CA', options).format(date);
};
