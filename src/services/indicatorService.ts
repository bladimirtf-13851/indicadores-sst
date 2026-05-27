import { EventRecord, EventType, AccidentType, MonthlyIndicator, OriginType, YearlyIndicator } from "../types";
import { format, parseISO, startOfMonth } from "date-fns";

const getResolvedEmployeeCount = (
  month: string,
  monthlyEmployeeCount: Record<string, number>
): number => {
  let employeeCount = monthlyEmployeeCount[month] || 0;
  if (employeeCount <= 0) {
    // Find all months in the record that have employeeCount > 0
    const configuredMonths = Object.keys(monthlyEmployeeCount)
      .filter(m => m <= month && monthlyEmployeeCount[m] > 0)
      .sort((a, b) => b.localeCompare(a)); // Sort descending for past closest
    
    if (configuredMonths.length > 0) {
      employeeCount = monthlyEmployeeCount[configuredMonths[0]];
    } else {
      // Check any future configured months
      const futureMonths = Object.keys(monthlyEmployeeCount)
        .filter(m => m > month && monthlyEmployeeCount[m] > 0)
        .sort((a, b) => a.localeCompare(b)); // Sort ascending for closest future
      if (futureMonths.length > 0) {
        employeeCount = monthlyEmployeeCount[futureMonths[0]];
      }
    }
  }
  return employeeCount > 0 ? employeeCount : 1; // Fallback to 1 to avoid division by zero
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
    const monthRecords = records.filter(r => r.date.startsWith(month));
    const employeeCount = getResolvedEmployeeCount(month, monthlyEmployeeCount);
    const programmedDays = monthlyProgrammedDays[month] || (employeeCount * 30);

    const accidents = monthRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const incidents = monthRecords.filter(r => r.eventType === EventType.INCIDENTE);
    const absenteeism = monthRecords.filter(r => r.eventType === EventType.AUSENTISMO);

    const accidentCount = accidents.length;
    const lostDaysAccidents = accidents.reduce((sum, r) => sum + r.lostDays + r.chargedDays, 0);
    const lostDaysAbsenteeism = absenteeism.reduce((sum, r) => sum + r.lostDays, 0);
    const lostDaysComun = absenteeism
      .filter(r => r.origin === OriginType.COMUN)
      .reduce((sum, r) => sum + r.lostDays, 0);

    // Indicator Formulas according to specification (Nº de accidentes de trabajo * 100 / numero de trabajadores)
    const frecuencia = (accidentCount * 100) / employeeCount;
    const severidad = (lostDaysAccidents / employeeCount) * 100;

    // Yearly calculations for mortality (projected or YTD)
    const year = month.split("-")[0];
    const yearRecords = records.filter(r => r.date.startsWith(year));
    const yearAccidents = yearRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const yearMortalCount = yearAccidents.filter(r => r.accidentType === AccidentType.MORTAL).length;
    
    // Average employees for the year so far
    const activeMonthsForYear = Object.keys(monthlyEmployeeCount).filter(m => m.startsWith(year));
    const avgEmployeesYear = activeMonthsForYear.length > 0
      ? activeMonthsForYear.reduce((sum, m) => sum + monthlyEmployeeCount[m], 0) / activeMonthsForYear.length
      : employeeCount;

    // Mortalidad: (Mortales / Promedio Trabajadores) * 100,000
    const mortalidad = (yearMortalCount / avgEmployeesYear) * 100000;

    const absenteeismLaboral = monthRecords.filter(r => r.eventType === EventType.AUSENTISMO && r.origin === OriginType.LABORAL);
    
    // Period Z usually refers to the month in this context or the year for yearly indicators
    const prevalenciaEL = (absenteeismLaboral.length / employeeCount) * 100000;
    const incidenciaEL = (absenteeismLaboral.filter(r => r.isNewCase).length / employeeCount) * 100000;

    const ausentismoMedica = (lostDaysAbsenteeism / programmedDays) * 100;
    const ausentismoComun = (lostDaysComun / programmedDays) * 100;

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
  const years = Array.from(new Set(records.map(r => r.date.split("-")[0]))).sort();
  if (years.length === 0) {
    const currentYear = new Date().getFullYear().toString();
    years.push(currentYear);
  }

  return years.map(year => {
    const yearRecords = records.filter(r => r.date.startsWith(year));
    const yearAccidents = yearRecords.filter(r => r.eventType === EventType.ACCIDENTE);
    const yearAbsenteeism = yearRecords.filter(r => r.eventType === EventType.AUSENTISMO);
    
    // Compute resolved employees for each of the 12 months of the year, then average them
    const monthsOfYear = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`);
    const resolvedEmployeesList = monthsOfYear.map(m => getResolvedEmployeeCount(m, monthlyEmployeeCount));
    const avgEmployees = resolvedEmployeesList.reduce((sum, val) => sum + val, 0) / 12;

    const yearPeriodMonths = Object.keys(monthlyProgrammedDays).filter(m => m.startsWith(year));
    const totalProgrammedDays = yearPeriodMonths.length > 0
      ? yearPeriodMonths.reduce((sum, m) => sum + monthlyProgrammedDays[m], 0)
      : (avgEmployees * 30 * (yearPeriodMonths.length || 12)) || 1;

    const accidentCount = yearAccidents.length;
    const lostDaysAccidents = yearAccidents.reduce((sum, r) => sum + r.lostDays + r.chargedDays, 0);
    const lostDaysAbsenteeism = yearAbsenteeism.reduce((sum, r) => sum + r.lostDays, 0);
    const mortalCount = yearAccidents.filter(r => r.accidentType === AccidentType.MORTAL).length;

    const absenteeismLaboral = yearAbsenteeism.filter(r => r.origin === OriginType.LABORAL);
    const incidenciaCount = absenteeismLaboral.filter(r => r.isNewCase).length;

    return {
      year,
      frecuencia: (accidentCount * 100) / avgEmployees,
      severidad: (lostDaysAccidents / avgEmployees) * 100,
      mortalidad: (mortalCount / avgEmployees) * 100000,
      incidenciaEL: (incidenciaCount / avgEmployees) * 100000,
      prevalenciaEL: (absenteeismLaboral.length / avgEmployees) * 100000,
      ausentismoMedica: (lostDaysAbsenteeism / totalProgrammedDays) * 100,
      accidentCount
    };
  });
};
