/**
 * Chapter-based validation rules for all modules.
 *
 * Source: CR_MOBILE_0202 – Sheet "Chapitrescomptablesaut"
 *
 * Each account has a `chapter` field (e.g. "26111010").
 * Before submitting any operation we check that the selected
 * account's chapter is in the allowed set for that module.
 *
 * Modules covered:
 *   1. Virement         (debit + credit sides)
 *   2. Demande chéquier  (single account)
 *   3. Paiement factures (single account)
 *   4. Recharge carte    (single account)
 */

// ═══════════════════════════════════════════════════════════════════
// 1. VIREMENT
// ═══════════════════════════════════════════════════════════════════

export const VIREMENT_DEBIT_CHAPTERS = new Set([
  "26111020", // COMPTES COMMERCIAUX
  "26112030", // COMPTE CHEQUE EN DINARS TRE
  "26112010", // COMPTE DINARS TTE
  "26111160", // COMPTE JEUNE
  "26111010", // DEPOTS A VUE EN DINARS
  "26111011", // DEPOTS A VUE EN TND PERSONNEL
  "26112070", // CPTE INTERIEURS NON RESIDENTS
  "26112111", // COMPTE EN TND POUR NR LYBIEN
  "26121040", // COMPTES DES SOCIETES
  "26312000", // CPTE CARTE IDDIKHAR  ⚠ same-client only
  "26111012", // COMPTE OFFRE WE TRUST
  "26111013", // COMPTE OFFRE WE START
]);

export const VIREMENT_CREDIT_CHAPTERS = new Set([
  "26321000", // COMPTE EPARGNE TTE
  "26321200", // CPTE EPARGNE LOGEMENT TND TRE
  "26321300", // COMPTE EPARGNE CLASSIQUE TRE
  "26312000", // CPTE CARTE IDDIKHAR
  "26311100", // PLAN EPARGNE MOSTAKBALI<2AN
  "26311500", // COMPTE EPARGNE MENZILI
  "26111160", // COMPTE JEUNE
  "26111020", // COMPTES COMMERCIAUX
  "26311200", // PLAN EPARGNE MENAGE RAFEHETI
  "26311300", // PLAN EPGNE MOSTAKBALI ENFANTS
  "26111010", // DEPOTS A VUE EN DINARS
  "26311110", // PLAN EPARGNE MOSTAKBALI > 2 AN
  "26112030", // COMPTE CHEQUE EN DINARS TRE
  "26112111", // COMPTE EN TND POUR NR LYBIEN
  "26121020", // COMPTES ASSOCIATIONS ET CLUBS
  "26311000", // COMPTES SPECIAUX D'EPARGNE
  "26121040", // COMPTES DES SOCIETES
  "26111011", // DEPOTS A VUE EN TND PERSONNEL
  "26111012", // COMPTE OFFRE WE TRUST
  "26111013", // COMPTE OFFRE WE START
  "26111015", // OFFRE STEP UP  ⚠ same-client only
]);

// ═══════════════════════════════════════════════════════════════════
// 2. DEMANDE DE CHÉQUIER
// ═══════════════════════════════════════════════════════════════════

export const CHEQUIER_CHAPTERS = new Set([
  "26111010", // DEPOTS A VUE EN DINARS
  "26111011", // DEPOTS A VUE EN TND PERSONNEL
  "26111020", // COMPTES COMMERCIAUX
  "26112010", // COMPTE DINARS TTE
  "26112020", // COMPTE TTE, TND CONVERTIBLES
  "26112030", // COMPTE CHEQUE EN DINARS TRE
  "26112070", // CPTE INTERIEURS NON RESIDENTS
  "26112080", // CPTE ETRANG EN TND CONVERTIBLE
  "26121020", // COMPTES ASSOCIATIONS ET CLUBS
  "26121030", // CPT COOPERAT & COMMUNAUT
  "26121040", // COMPTES DES SOCIETES
  "26121110", // CPTE AMNISTIE EN DEVISE CONVE
  "26122040", // CPTE ETRANGERS TND CONVERTI
  "26122100", // CPTE PROFESSIONEL NEGOCE TNC
  "26922000", // COMPTE SEQUESTRE
]);

// ═══════════════════════════════════════════════════════════════════
// 3. PAIEMENT DE FACTURES
// ═══════════════════════════════════════════════════════════════════

export const FACTURE_CHAPTERS = new Set([
  "26111020", // COMPTES COMMERCIAUX
  "26112030", // COMPTE CHEQUE EN DINARS TRE
  "26112010", // COMPTE DINARS TTE
  "26111160", // COMPTE JEUNE
  "26111010", // DEPOTS A VUE EN DINARS
  "26111011", // DEPOTS A VUE EN TND PERSONNEL
  "26112070", // CPTE INTERIEURS NON RESIDENTS
  "26112111", // COMPTE EN TND POUR NR LYBIEN
  "26121040", // COMPTES DES SOCIETES
  "26111012", // COMPTE OFFRE WE TRUST
  "26111013", // COMPTE OFFRE WE START
]);

// ═══════════════════════════════════════════════════════════════════
// 4. RECHARGE CARTE PRÉPAYÉE
// ═══════════════════════════════════════════════════════════════════

export const RECHARGE_CARTE_CHAPTERS = new Set([
  "26111020", // COMPTES COMMERCIAUX
  "26112030", // COMPTE CHEQUE EN DINARS TRE
  "26112010", // COMPTE DINARS TTE
  "26111160", // COMPTE JEUNE
  "26111010", // DEPOTS A VUE EN DINARS
  "26111011", // DEPOTS A VUE EN TND PERSONNEL
  "26112070", // CPTE INTERIEURS NON RESIDENTS
  "26112111", // COMPTE EN TND POUR NR LYBIEN
  "26121040", // COMPTES DES SOCIETES
  "26111012", // COMPTE OFFRE WE TRUST
  "26111013", // COMPTE OFFRE WE START
]);

// ═══════════════════════════════════════════════════════════════════
// Special same-client chapters (Virement only)
// ═══════════════════════════════════════════════════════════════════

const IDDIKHAR_CHAPTER = "26312000";
const STEP_UP_CHAPTER = "26111015";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type AccountLike = {
  chapter?: string;
  customerCode?: string;
};

export type ChapterValidationResult = {
  valid: boolean;
  /** i18n key for the flash message title */
  errorKey: string | null;
  /** which picker should show the red border (virement only) */
  target: "from" | "to" | null;
};

// ═══════════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════════

const OK: ChapterValidationResult = {
  valid: true,
  errorKey: null,
  target: null,
};

/**
 * Generic single-account check.
 * Used by chéquier, factures, and recharge carte.
 */
function validateSingleAccount(
  account: AccountLike | null,
  allowedChapters: Set<string>,
  errorKey: string,
): ChapterValidationResult {
  if (!account) return OK;

  const chapter = String(account.chapter ?? "").trim();
  if (!chapter || !allowedChapters.has(chapter)) {
    return { valid: false, errorKey, target: "from" };
  }
  return OK;
}

/**
 * VIREMENT — validate debit + credit chapters with same-client rules.
 *
 * @param from  – debit account (always available)
 * @param to    – credit account (null for beneficiary transfers)
 */
export function validateVirementChapters(
  from: AccountLike | null,
  to: AccountLike | null,
): ChapterValidationResult {
  if (!from) return OK;

  const fromChapter = String(from.chapter ?? "").trim();

  // 1. Debit chapter must be allowed
  if (!fromChapter || !VIREMENT_DEBIT_CHAPTERS.has(fromChapter)) {
    return {
      valid: false,
      errorKey: "chapter.virement.debitNotAuthorized",
      target: "from",
    };
  }

  // 2. IDDIKHAR debit → only same-client internal accounts allowed (no beneficiaries)
  if (fromChapter === IDDIKHAR_CHAPTER) {
    if (!to) {
      return {
        valid: false,
        errorKey: "chapter.virement.iddikharSameClient",
        target: "to",
      };
    }
    const sameClient =
      !!from.customerCode &&
      !!to.customerCode &&
      from.customerCode === to.customerCode;
    if (!sameClient) {
      return {
        valid: false,
        errorKey: "chapter.virement.iddikharSameClient",
        target: "to",
      };
    }
  }

  // If no credit account (beneficiary transfer), stop here
  if (!to) return OK;

  const toChapter = String(to.chapter ?? "").trim();

  // 3. Credit chapter must be allowed
  if (!toChapter || !VIREMENT_CREDIT_CHAPTERS.has(toChapter)) {
    return {
      valid: false,
      errorKey: "chapter.virement.creditNotAuthorized",
      target: "to",
    };
  }

  // 4. STEP UP credit → debit must be same client
  if (toChapter === STEP_UP_CHAPTER) {
    const sameClient =
      !!from.customerCode &&
      !!to.customerCode &&
      from.customerCode === to.customerCode;
    if (!sameClient) {
      return {
        valid: false,
        errorKey: "chapter.virement.stepUpSameClient",
        target: "from",
      };
    }
  }

  return OK;
}

/**
 * DEMANDE DE CHÉQUIER — validate that the account can request a chequebook.
 */
export function validateChequierChapter(
  account: AccountLike | null,
): ChapterValidationResult {
  return validateSingleAccount(
    account,
    CHEQUIER_CHAPTERS,
    "chapter.chequier.notAuthorized",
  );
}

/**
 * PAIEMENT DE FACTURES — validate that the account can pay bills.
 */
export function validateFactureChapter(
  account: AccountLike | null,
): ChapterValidationResult {
  return validateSingleAccount(
    account,
    FACTURE_CHAPTERS,
    "chapter.facture.notAuthorized",
  );
}

/**
 * RECHARGE CARTE PRÉPAYÉE — validate that the account can top up a card.
 */
export function validateRechargeCarteChapter(
  account: AccountLike | null,
): ChapterValidationResult {
  return validateSingleAccount(
    account,
    RECHARGE_CARTE_CHAPTERS,
    "chapter.rechargeCarte.notAuthorized",
  );
}