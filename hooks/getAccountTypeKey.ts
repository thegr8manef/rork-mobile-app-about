export const getAccountTypeKey = (type?: string | number) => {
  const t = String(type ?? "").trim();
  switch (t) {
    case "1":
      return "cards.accountType.debit";
    case "2":
      return "cards.accountType.prepaid";
    case "3":
      return "cards.accountType.savings";
    case "4":
      return "cards.accountType.credit";
    default:
      return "cards.accountType.unknown";
  }
};