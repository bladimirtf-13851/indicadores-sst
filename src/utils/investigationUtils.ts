import { EventRecord, AccidentInvestigation } from '../types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * Determines whether an investigation is considered completed/closed according to Res. 1401/2007.
 * Standardizes 'Finalizada', 'Cerrada', 'Aprobada', etc.
 */
export function isInvestigationCompleted(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return (
    s === 'finalizada' ||
    s === 'cerrada' ||
    s === 'aprobada' ||
    s === 'concluida' ||
    s === 'completada'
  );
}

/**
 * Determines whether an investigation is currently in draft or review.
 */
export function isInvestigationInProgress(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return (
    s === 'borrador' ||
    s === 'en revisión' ||
    s === 'en revision' ||
    s === 'en trámite' ||
    s === 'en tramite' ||
    s === 'en proceso'
  );
}

/**
 * Robustly matches an accident record with an investigation from the database.
 * 1. Checks exact recordId
 * 2. Checks worker identification number + date
 * 3. Checks worker name + date
 * 4. Checks worker identification number alone if unique
 * 5. Checks worker name alone if unique
 */
export function findInvestigationForRecord(
  record: EventRecord,
  investigations: AccidentInvestigation[]
): AccidentInvestigation | undefined {
  if (!record || !investigations || investigations.length === 0) return undefined;

  // 1. Direct recordId match
  const directMatch = investigations.find(inv => inv.recordId === record.id);
  if (directMatch) return directMatch;

  const recDate = (record.date || '').trim();
  const recDoc = (record.idNumber || '').trim();
  const recNameNorm = (record.employeeName || '').toLowerCase().trim();

  // Helper to compare dates within 3 days tolerance in case of minor entry differences
  const isCloseDate = (d1: string, d2: string): boolean => {
    try {
      if (!d1 || !d2) return false;
      if (d1 === d2) return true;
      const p1 = parseISO(d1);
      const p2 = parseISO(d2);
      if (isNaN(p1.getTime()) || isNaN(p2.getTime())) return false;
      const diff = Math.abs(differenceInCalendarDays(p1, p2));
      return !isNaN(diff) && diff <= 3;
    } catch {
      return false;
    }
  };

  // 2. Document + Date match
  if (recDoc && recDate) {
    const docDateMatch = investigations.find(inv => {
      const invDoc = (inv.idNumber || '').trim();
      const invDate = (inv.accidentDate || '').trim();
      return invDoc === recDoc && isCloseDate(invDate, recDate);
    });
    if (docDateMatch) return docDateMatch;
  }

  // 3. Name + Date match
  if (recNameNorm && recDate) {
    const nameDateMatch = investigations.find(inv => {
      const invNameNorm = (inv.employeeName || '').toLowerCase().trim();
      const invDate = (inv.accidentDate || '').trim();
      const nameMatches =
        invNameNorm === recNameNorm ||
        invNameNorm.includes(recNameNorm) ||
        recNameNorm.includes(invNameNorm);
      return nameMatches && isCloseDate(invDate, recDate);
    });
    if (nameDateMatch) return nameDateMatch;
  }

  // 4. Document match if only one accident exists for that worker
  if (recDoc) {
    const docMatches = investigations.filter(inv => (inv.idNumber || '').trim() === recDoc);
    if (docMatches.length === 1) return docMatches[0];
  }

  // 5. Name match if only one accident exists for that worker
  if (recNameNorm) {
    const nameMatches = investigations.filter(inv => {
      const invNameNorm = (inv.employeeName || '').toLowerCase().trim();
      return (
        invNameNorm === recNameNorm ||
        invNameNorm.includes(recNameNorm) ||
        recNameNorm.includes(invNameNorm)
      );
    });
    if (nameMatches.length === 1) return nameMatches[0];
  }

  return undefined;
}
