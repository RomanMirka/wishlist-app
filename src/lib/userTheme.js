const USER_THEMES = {
  "віка": {
    className: "user-vika",
    color: "var(--user-vika)",
    ink: "var(--user-vika-ink)",
  },
  "ромчик": {
    className: "user-romchyk",
    color: "var(--user-romchyk)",
    ink: "var(--user-romchyk-ink)",
  },
};

function normalizeName(name) {
  return String(name ?? "").trim().normalize("NFC").toLocaleLowerCase("uk-UA");
}

export function getUserThemeClass(name) {
  return USER_THEMES[normalizeName(name)]?.className ?? "";
}

export function getOwnerTheme(name) {
  const theme = USER_THEMES[normalizeName(name)];
  return {
    color: theme?.color ?? "var(--owner-unknown)",
    ink: theme?.ink ?? "var(--owner-unknown-ink)",
  };
}

export function getDisplayName(name) {
  return String(name ?? "").trim() || "Невідомо";
}
