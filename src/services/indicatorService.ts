import { EventRecord, EventType, AccidentType, MonthlyIndicator, OriginType, YearlyIndicator } from "../types";

/**
 * Parses YYYY-MM-DD string into a safe Date object (midday UTC) to avoid DST or timezone shifts
 */
export const parseDateOnly = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const clean = dateStr.split("T")[0].trim();
  const parts = clean.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
};

/**
 * Formats a Date object into YYYY-MM-DD (UTC based)
 */
export const formatDateOnly = (d: Date): string => {
  const year = d.getUTCFullYear();
  const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Resolves the employee count for a given month.
 * If the month has a configured employee count (> 0), it uses it.
 * If not, it looks for the closest configured month (past or future), or the latest non-zero configuration.
 * If no configuration exists anywhere, returns 0.
 */
export const getResolvedEmployeeCount = (
  month: string,
  monthlyEmployeeCount: Record<string, number>
): number => {
  if (!monthlyEmployeeCount) return 0;

  // 1. Direct configuration for this specific month
  const exactCount = monthlyEmployeeCount[month];
  if (typeof exactCount === 'number' && exactCount > 0) {
    return exactCount;
  }

  // 2. Find any configured months in the company
  const configuredMonths = Object.keys(monthlyEmployeeCount)
    .filter(m => (monthlyEmployeeCount[m] || 0) > 0);

  if (configuredMonths.length === 0) {
    return 0; // No employees configured yet
  }

  // 3. Find closest previous configured month
  const pastMonths = configuredMonths
    .filter(m => m <= month)
    .sort((a, b) => b.localeCompare(a));
  if (pastMonths.length > 0) {
    return monthlyEmployeeCount[pastMonths[0]];
  }

  // 4. Find closest future configured month
  const futureMonths = configuredMonths
    .filter(m => m > month)
    .sort((a, b) => a.localeCompare(b));
  if (futureMonths.length > 0) {
    return monthlyEmployeeCount[futureMonths[0]];
  }

  // Fallback to the first available positive number
  return monthlyEmployeeCount[configuredMonths[0]] || 0;
};

/**
 * Calculates the exact start and end dates of the incapacity period.
 * Adheres strictly to Colombian Resolution 1401/2007 & Res. 0312/2019:
 * - If start and end are provided: uses them.
 * - If only start + lostDays: end = start + lostDays - 1.
 * - If only end + lostDays: start = end - lostDays + 1.
 * - If only event date + lostDays: start = event date, end = start + lostDays - 1.
 */
export const getIncapacityInterval = (r: EventRecord): { start: Date; end: Date } | null => {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (r.incapacityStartDate) {
    startDate = parseDateOnly(r.incapacityStartDate);
  }
  if (r.incapacityEndDate) {
    endDate = parseDateOnly(r.incapacityEndDate);
  }

  // If we have both dates
  if (startDate && endDate) {
    if (startDate <= endDate) {
      return { start: startDate, end: endDate };
    }
  }

  const lostDays = r.lostDays || 0;

  // If we have start date and lost days > 0
  if (startDate && lostDays > 0) {
    const calculatedEnd = new Date(startDate.getTime());
    calculatedEnd.setUTCDate(calculatedEnd.getUTCDate() + lostDays - 1);
    return { start: startDate, end: calculatedEnd };
  }

  // If we have end date and lost days > 0
  if (endDate && lostDays > 0) {
    const calculatedStart = new Date(endDate.getTime());
    calculatedStart.setUTCDate(calculatedStart.getUTCDate() - lostDays + 1);
    return { start: calculatedStart, end: endDate };
  }

  // Fallback to event date
  if (r.date && lostDays > 0) {
    const eventDate = parseDateOnly(r.date);
    if (eventDate) {
      const calculatedEnd = new Date(eventDate.getTime());
      calculatedEnd.setUTCDate(calculatedEnd.getUTCDate() + lostDays - 1);
      return { start: eventDate, end: calculatedEnd };
    }
  }

  return null;
};

/**
 * Returns strictly the number of incapacity days that fall within targetMonthStr ("YYYY-MM").
 * Distributes days chronologically month by month until the incapacity ends.
 */
export const getOverlappingDays = (
  interval: { start: Date; end: Date } | null,
  targetMonthStr: string // "YYYY-MM"
): number => {
  if (!interval || !targetMonthStr) return 0;
  
  const [year, month] = targetMonthStr.split("-").map(Number);
  if (!year || !month || isNaN(year) || isNaN(month)) return 0;

  // First day of target month at 12:00 UTC
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  // Last day of target month at 12:00 UTC (day 0 of next month)
  const monthEnd = new Date(Date.UTC(year, month, 0, 12, 0, 0));

  const { start, end } = interval;

  // Check if completely outside
  if (start.getTime() > monthEnd.getTime() || end.getTime() < monthStart.getTime()) {
    return 0;
  }

  // Overlap window
  const overlapStart = Math.max(start.getTime(), monthStart.getTime());
  const overlapEnd = Math.min(end.getTime(), monthEnd.getTime());

  if (overlapStart > overlapEnd) {
    return 0;
  }

  const diffMs = overlapEnd - overlapStart;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diffDays);
};

export const calculateIndicators = (
  records: EventRecord[],
  monthlyEmployeeCount: Record<string, number>,
  monthlyProgrammedDays: Record<string, number>
): MonthlyIndicator[] => {
  const currentYear = new Date().getFullYear();
  
  // Generate all 12 months for the current year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `${currentYear}-${month}`;
  });

  return months.map(month => {
    // Records whose event date was in this month
    const monthRecords = records.filter(r => r.date && r.date.startsWith(month));
    
    // Workers in the month
    const employeeCount = getResolvedEmployeeCount(month, monthlyEmployeeCount);
    const programmedDays = monthlyProgrammedDays[month] || (employeeCount > 0 ? employeeCount * 30 : 30);

    const accidents = monthRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const incidents = monthRecords.filter(r => r.eventType === EventType.INCIDENTE);
    const absenteeism = monthRecords.filter(r => r.eventType === EventType.AUSENTISMO);

    const accidentCount = accidents.length;

    // Distribute lost days of accidents that fall chronologically in this calendar month
    const lostDaysAccidents = records
      .filter(r => r.eventType === EventType.ACCIDENTE)
      .reduce((sum, r) => {
        const interval = getIncapacityInterval(r);
        const overlapDays = interval ? getOverlappingDays(interval, month) : 0;
        // Charged days (días cargados por secuelas permanentes o muerte) are charged in the month of occurrence
        const chargedInMonth = r.date && r.date.startsWith(month) ? (r.chargedDays || 0) : 0;
        return sum + overlapDays + chargedInMonth;
      }, 0);

    // Distribute lost days of absenteeism that fall chronologically in this calendar month
    const lostDaysAbsenteeism = records
      .filter(r => r.eventType === EventType.AUSENTISMO)
      .reduce((sum, r) => {
        const interval = getIncapacityInterval(r);
        const overlapDays = interval ? getOverlappingDays(interval, month) : 0;
        return sum + overlapDays;
      }, 0);

    // Common origin absenteeism lost days in this month
    const lostDaysComun = records
      .filter(r => r.eventType === EventType.AUSENTISMO && r.origin === OriginType.COMUN)
      .reduce((sum, r) => {
        const interval = getIncapacityInterval(r);
        const overlapDays = interval ? getOverlappingDays(interval, month) : 0;
        return sum + overlapDays;
      }, 0);

    // -------------------------------------------------------------
    // FÓRMULAS DE INDICADORES (Resolución 0312 de 2019 / MinTrabajo)
    // -------------------------------------------------------------
    // Índice de Frecuencia: (Nº de accidentes de trabajo en el mes * 100) / (Nº trabajadores en el mes)
    // Si employeeCount no está configurado (0), el indicador es 0 para evitar divisiones erróneas por 1
    const frecuencia = employeeCount > 0 
      ? Number(((accidentCount * 100) / employeeCount).toFixed(2))
      : 0;

    // Índice de Severidad: (Nº de días perdidos por accidentes de trabajo en el mes * 100) / (Nº trabajadores en el mes)
    const severidad = employeeCount > 0 
      ? Number(((lostDaysAccidents * 100) / employeeCount).toFixed(2))
      : 0;

    // Mortalidad: (Nº de accidentes mortales en el año / Promedio de trabajadores) * 100.000
    const year = month.split("-")[0];
    const yearRecords = records.filter(r => r.date && r.date.startsWith(year));
    const yearAccidents = yearRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const yearMortalCount = yearAccidents.filter(r => r.accidentType === AccidentType.MORTAL).length;
    
    // Average employees for the year so far
    const avgEmployeesYear = employeeCount > 0 ? employeeCount : 1;
    const mortalidad = employeeCount > 0 
      ? Number(((yearMortalCount / avgEmployeesYear) * 100000).toFixed(2))
      : 0;

    const absenteeismLaboral = monthRecords.filter(r => r.eventType === EventType.AUSENTISMO && r.origin === OriginType.LABORAL);
    const prevalenciaEL = employeeCount > 0 
      ? Number(((absenteeismLaboral.length / employeeCount) * 100000).toFixed(2))
      : 0;
    const incidenciaEL = employeeCount > 0 
      ? Number(((absenteeismLaboral.filter(r => r.isNewCase).length / employeeCount) * 100000).toFixed(2))
      : 0;

    const ausentismoMedica = programmedDays > 0 
      ? Number(((lostDaysAbsenteeism / programmedDays) * 100).toFixed(2))
      : 0;
    const ausentismoComun = programmedDays > 0 
      ? Number(((lostDaysComun / programmedDays) * 100).toFixed(2))
      : 0;

    return {
      month,
      frecuencia,
      severidad,
      mortalidad,
      prevalenciaEL,
      incidenciaEL,
      ausentismoMedica,
      ausentismoComun,
      accidentCount,
      incidentCount: incidents.length,
      absenteeismCount: absenteeism.length,
      lostDaysTotal: lostDaysAccidents + lostDaysAbsenteeism,
      employeeCount
    };
  });
};

export const calculateYearlyIndicators = (
  records: EventRecord[],
  monthlyEmployeeCount: Record<string, number>,
  monthlyProgrammedDays: Record<string, number>
): YearlyIndicator[] => {
  const years = Array.from(new Set(records.map(r => r.date ? r.date.split("-")[0] : ''))).filter(Boolean).sort();
  if (years.length === 0) {
    const currentYear = new Date().getFullYear().toString();
    years.push(currentYear);
  }

  return years.map(year => {
    const yearRecords = records.filter(r => r.date && r.date.startsWith(year));
    const yearAccidents = yearRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const yearAbsenteeism = yearRecords.filter(r => r.eventType === EventType.AUSENTISMO);
    
    // Compute resolved employees for each of the 12 months of the year, then average them
    const monthsOfYear = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`);
    const resolvedEmployeesList = monthsOfYear.map(m => getResolvedEmployeeCount(m, monthlyEmployeeCount));
    const nonZeroEmployees = resolvedEmployeesList.filter(e => e > 0);
    const avgEmployees = nonZeroEmployees.length > 0
      ? nonZeroEmployees.reduce((sum, val) => sum + val, 0) / nonZeroEmployees.length
      : 0;

    const yearPeriodMonths = Object.keys(monthlyProgrammedDays || {}).filter(m => m.startsWith(year));
    const totalProgrammedDays = yearPeriodMonths.length > 0
      ? yearPeriodMonths.reduce((sum, m) => sum + (monthlyProgrammedDays[m] || 0), 0)
      : (avgEmployees * 30 * 12) || 0;

    const accidentCount = yearAccidents.length;
    
    // Distribute lost days of accidents that overlap with any month of the target year
    const lostDaysAccidents = records
      .filter(r => r.eventType === EventType.ACCIDENTE)
      .reduce((sum, r) => {
        const interval = getIncapacityInterval(r);
        if (!interval) return sum;
        let overlapDaysForYear = 0;
        for (const m of monthsOfYear) {
          overlapDaysForYear += getOverlappingDays(interval, m);
        }
        const chargedInYear = r.date && r.date.startsWith(year) ? (r.chargedDays || 0) : 0;
        return sum + overlapDaysForYear + chargedInYear;
      }, 0);

    // Distribute lost days of absenteeism that overlap with months of the target year
    const lostDaysAbsenteeism = records
      .filter(r => r.eventType === EventType.AUSENTISMO)
      .reduce((sum, r) => {
        const interval = getIncapacityInterval(r);
        if (!interval) return sum;
        let overlapDaysForYear = 0;
        for (const m of monthsOfYear) {
          overlapDaysForYear += getOverlappingDays(interval, m);
        }
        return sum + overlapDaysForYear;
      }, 0);

    const mortalCount = yearAccidents.filter(r => r.accidentType === AccidentType.MORTAL).length;
    const absenteeismLaboral = yearAbsenteeism.filter(r => r.origin === OriginType.LABORAL);
    const incidenciaCount = absenteeismLaboral.filter(r => r.isNewCase).length;

    return {
      year,
      frecuencia: avgEmployees > 0 ? Number(((accidentCount * 100) / avgEmployees).toFixed(2)) : 0,
      severidad: avgEmployees > 0 ? Number(((lostDaysAccidents * 100) / avgEmployees).toFixed(2)) : 0,
      mortalidad: avgEmployees > 0 ? Number(((mortalCount / avgEmployees) * 100000).toFixed(2)) : 0,
      incidenciaEL: avgEmployees > 0 ? Number(((incidenciaCount / avgEmployees) * 100000).toFixed(2)) : 0,
      prevalenciaEL: avgEmployees > 0 ? Number(((absenteeismLaboral.length / avgEmployees) * 100000).toFixed(2)) : 0,
      ausentismoMedica: totalProgrammedDays > 0 ? Number(((lostDaysAbsenteeism / totalProgrammedDays) * 100).toFixed(2)) : 0,
      accidentCount
    };
  });
};
