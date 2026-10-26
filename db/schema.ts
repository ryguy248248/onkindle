import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const messages = pgTable(
  "messages",
  {
    id: serial().primaryKey(),
    userId: text("user_id").notNull(),
    author: text().notNull(),
    body: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_created_at_idx").on(t.createdAt)],
);
