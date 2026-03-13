const PREFIX = "[Glance AI]";
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(PREFIX, ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(PREFIX, ...args);
  },
  error: (...args: unknown[]) => {
    console.error(PREFIX, ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(PREFIX, ...args);
  },
};
