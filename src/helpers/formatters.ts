import dayjs from 'dayjs'

export const formatDateDMYT = (date: Date | number) => {
  return dayjs(date).format('DD.MM.YYYY HH:mm')
}
