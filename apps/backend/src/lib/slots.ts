import { addMinutes, startOfDay, setHours, setMinutes, isBefore, isAfter, isEqual, addDays, getDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { prisma } from './prisma';

const TIMEZONE = 'America/Bogota';
const SLOT_INCREMENT_MINUTES = 30;

interface AvailabilityRule {
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

interface BookingConflict {
  startTime: Date;
  endTime: Date;
  bufferMinutesBefore: number;
  bufferMinutesAfter: number;
}

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
}

// Parse "HH:mm" string into hours and minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

// Generate available time slots for a provider's service within a date range
export async function getAvailableSlots(
  workspaceId: string,
  serviceId: string,
  fromDate: Date,
  toDate: Date
): Promise<TimeSlot[]> {
  // Fetch service details
  const service = await prisma.service.findFirst({
    where: { id: serviceId, workspaceId, active: true },
  });
  if (!service) return [];

  // Fetch availability rules
  const rules = await prisma.availabilityRule.findMany({
    where: { workspaceId },
  });
  if (rules.length === 0) return [];

  // Fetch existing confirmed bookings in the date range (with buffers from their services)
  const existingBookings = await prisma.booking.findMany({
    where: {
      workspaceId,
      status: 'CONFIRMED',
      startTime: { lte: toDate },
      endTime: { gte: fromDate },
    },
    include: {
      service: {
        select: { bufferMinutesBefore: true, bufferMinutesAfter: true },
      },
    },
  });

  const conflicts: BookingConflict[] = existingBookings.map((b) => ({
    startTime: b.startTime,
    endTime: b.endTime,
    bufferMinutesBefore: b.service.bufferMinutesBefore,
    bufferMinutesAfter: b.service.bufferMinutesAfter,
  }));

  const slots: TimeSlot[] = [];
  const now = new Date();

  // Iterate over each day in range
  let currentDay = startOfDay(toZonedTime(fromDate, TIMEZONE));
  const lastDay = startOfDay(toZonedTime(toDate, TIMEZONE));

  while (!isAfter(currentDay, lastDay)) {
    const dayOfWeek = getDay(currentDay); // 0=Sunday

    // Find rules for this day
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);

    for (const rule of dayRules) {
      const { hours: startH, minutes: startM } = parseTime(rule.startTime);
      const { hours: endH, minutes: endM } = parseTime(rule.endTime);

      // Build window start/end in Bogota timezone
      let windowStart = setMinutes(setHours(currentDay, startH), startM);
      const windowEnd = setMinutes(setHours(currentDay, endH), endM);

      // Generate slots within window
      while (true) {
        const slotStart = windowStart;
        const slotEnd = addMinutes(slotStart, service.durationMinutes);

        // Slot must fit within availability window
        if (isAfter(slotEnd, windowEnd)) break;

        // Convert to UTC for comparison
        const slotStartUTC = fromZonedTime(slotStart, TIMEZONE);
        const slotEndUTC = fromZonedTime(slotEnd, TIMEZONE);

        // Skip past slots
        if (isAfter(slotStartUTC, now) || isEqual(slotStartUTC, now)) {
          // Check for conflicts with existing bookings
          const effectiveStart = addMinutes(slotStartUTC, -service.bufferMinutesBefore);
          const effectiveEnd = addMinutes(slotEndUTC, service.bufferMinutesAfter);

          const hasConflict = conflicts.some((conflict) => {
            const conflictEffectiveStart = addMinutes(conflict.startTime, -conflict.bufferMinutesBefore);
            const conflictEffectiveEnd = addMinutes(conflict.endTime, conflict.bufferMinutesAfter);

            // Check overlap between effective ranges
            return isBefore(effectiveStart, conflictEffectiveEnd) &&
                   isAfter(effectiveEnd, conflictEffectiveStart);
          });

          if (!hasConflict) {
            slots.push({
              startTime: slotStartUTC.toISOString(),
              endTime: slotEndUTC.toISOString(),
            });
          }
        }

        // Move to next slot increment
        windowStart = addMinutes(windowStart, SLOT_INCREMENT_MINUTES);
      }
    }

    currentDay = addDays(currentDay, 1);
  }

  return slots;
}
