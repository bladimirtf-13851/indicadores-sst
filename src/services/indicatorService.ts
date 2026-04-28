import { EventRecord, EventType, AccidentType, MonthlyIndicator, OriginType, YearlyIndicator } from "../types";
import { format, parseISO, startOfMonth } from "date-fns";

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
    const monthRecords = records.filter(r => format(parseISO(r.date), "yyyy-MM") === month);
    const employeeCount = monthlyEmployeeCount[month] || 1;
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

    // Indicator Formulas according to specification
    const frecuencia = (accidentCount / employeeCount) * 100;
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
    
    const yearMonths = Object.keys(monthlyEmployeeCount).filter(m => m.startsWith(year));
    const avgEmployees = yearMonths.length > 0 
      ? yearMonths.reduce((sum, m) => sum + monthlyEmployeeCount[m], 0) / yearMonths.length
      : 1;

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
      frecuencia: (accidentCount / avgEmployees) * 100,
      severidad: (lostDaysAccidents / avgEmployees) * 100,
      mortalidad: (mortalCount / avgEmployees) * 100000,
      incidenciaEL: (incidenciaCount / avgEmployees) * 100000,
      prevalenciaEL: (absenteeismLaboral.length / avgEmployees) * 100000,
      ausentismoMedica: (lostDaysAbsenteeism / totalProgrammedDays) * 100,
      accidentCount
    };
  });
};
