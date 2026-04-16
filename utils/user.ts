// utils/user.ts

export type User = {
  firstName?: string | null;
  lastName?: string | null;
  defaultUser?: string | null;
};

export const getPrimaryUser = (users?: User[]) => {
  if (!users?.length) return undefined;

  return (
    users.find(
      (x) =>
        x.defaultUser === "true" ||
        x.defaultUser === "1" ||
        x.defaultUser === "Y",
    ) ?? users[0]
  );
};

export const getFullName = (user?: User) => {
  const first = (user?.firstName ?? "").trim();
  const last = (user?.lastName ?? "").trim();
  return `${first} ${last}`.trim() || "-";
};

export const getInitials = (user?: User) => {
  const first = (user?.firstName ?? "").trim().charAt(0).toUpperCase();
  const last = (user?.lastName ?? "").trim().charAt(0).toUpperCase();
  return `${first}${last}`.trim() || "-";
};

const AVATAR_COLORS = [
  "#f64427",
  "#ff6b4f",
  "#d93a1f",
  "#FF9800",
  "#D97842",
  "#C44F3D",
  "#DD7143",
  "#E53935",
];

export const pickColorFromString = (s: string, colors = AVATAR_COLORS) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
};

export const getAvatarBg = (user?: User) => {
  const key =
    `${user?.firstName ?? ""}${user?.lastName ?? ""}`.trim() || "user";
  return pickColorFromString(key);
};
