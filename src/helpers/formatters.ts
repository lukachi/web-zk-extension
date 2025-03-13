import dayjs from 'dayjs'

export const formatDateDMYT = (date: Date | number) => {
  return dayjs(date).format('DD.MM.YYYY HH:mm')
}

export const formatByteLength = (length: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']

  let unitIndex = 0
  let currentLength = length

  while (currentLength > 1024 && unitIndex < units.length) {
    currentLength /= 1024
    unitIndex++
  }

  return `${currentLength.toFixed(2)} ${units[unitIndex]}`
}
