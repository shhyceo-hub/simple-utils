import KoreanLunarCalendar from 'korean-lunar-calendar';

export function convertLunar({ direction = 'solar', year, month, day, leap = false }) {
  const values = [year, month, day].map(Number);
  if (!values.every(Number.isInteger) || values.some((v) => v < 1)) throw new Error('연·월·일을 정수로 입력해 주세요.');
  const calendar = new KoreanLunarCalendar();
  const ok = direction === 'solar' ? calendar.setSolarDate(...values) : calendar.setLunarDate(...values, Boolean(leap));
  if (!ok) throw new Error('존재하지 않는 날짜이거나 지원 범위를 벗어났어요. 음력 입력은 윤달 여부도 확인해 주세요.');
  return { solar: calendar.getSolarCalendar(), lunar: calendar.getLunarCalendar(), gapja: calendar.getKoreanGapja() };
}

export const dateText = ({ year, month, day }) => `${year}년 ${month}월 ${day}일`;
