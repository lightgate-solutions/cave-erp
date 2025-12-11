import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function calculateAnniversaryDay(date: Date): number {
  const day = dayjs.utc(date).date();
  return Math.min(day, 28);
}

export function isBillingAnniversary(anniversaryDay: number): boolean {
  const today = dayjs.utc();
  const todayDay = today.date();

  return todayDay === anniversaryDay;
}

export function calculateNextPeriodEnd(
  currentPeriodStart: Date,
  anniversaryDay: number | null,
): Date {
  const start = dayjs.utc(currentPeriodStart);

  const nextMonth = start.add(1, "month");

  const daysInNextMonth = nextMonth.daysInMonth();

  const effectiveAnniversaryDay =
    anniversaryDay ?? calculateAnniversaryDay(currentPeriodStart);

  const targetDay = Math.min(effectiveAnniversaryDay, daysInNextMonth);

  return nextMonth.date(targetDay).toDate();
}

export function wasInvoicedToday(lastInvoicedAt: Date | null): boolean {
  if (!lastInvoicedAt) return false;

  const today = dayjs.utc().format("YYYY-MM-DD");
  const lastInvoiced = dayjs.utc(lastInvoicedAt).format("YYYY-MM-DD");

  return today === lastInvoiced;
}

export function calculatePlanChangeProration(
  oldPricePerMember: number,
  newPricePerMember: number,
  memberCount: number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
): {
  credit: number;
  charge: number;
  netAmount: number;
  remainingDays: number;
  totalDays: number;
} {
  const now = dayjs.utc();
  const periodStart = dayjs.utc(currentPeriodStart);
  const periodEnd = dayjs.utc(currentPeriodEnd);

  const totalDays = periodEnd.diff(periodStart, "day");
  const remainingDays = periodEnd.diff(now, "day");

  if (remainingDays <= 0) {
    return {
      credit: 0,
      charge: 0,
      netAmount: 0,
      remainingDays: 0,
      totalDays,
    };
  }

  const prorationFactor = remainingDays / totalDays;

  const credit = oldPricePerMember * memberCount * prorationFactor;

  const charge = newPricePerMember * memberCount * prorationFactor;

  const netAmount = charge - credit;

  return {
    credit: Math.round(credit * 100) / 100, // Round to 2 decimals
    charge: Math.round(charge * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    remainingDays,
    totalDays,
  };
}

export function calculateDaysOverdue(
  dueDate: string | Date,
  currentDate: Date = new Date(),
): number {
  const due = dayjs.utc(dueDate);
  const now = dayjs.utc(currentDate);

  const diff = now.diff(due, "day");

  return Math.max(0, diff);
}
