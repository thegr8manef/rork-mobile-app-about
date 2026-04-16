// components/home/transfermoney/TransferHistory/debug/TransferHistoryLogger.ts
export type THLogLevel = "info" | "warn" | "error";

const TAG = "[TH]";

function now() {
  const d = new Date();
  return d.toISOString().split("T")[1]?.replace("Z", "");
}

export function thLog(level: THLogLevel, title: string, payload?: any) {
  const header = `${TAG} ${now()} ${title}`;
  if (!payload) {
    console.log(header);
    return;
  }

  // avoid huge logs
  const safe =
    typeof payload === "string"
      ? payload
      : JSON.stringify(payload, null, 2).slice(0, 4000);

  if (level === "error") console.log(header, safe);
  else if (level === "warn") console.warn(header, safe);
  else console.log(header, safe);
}
