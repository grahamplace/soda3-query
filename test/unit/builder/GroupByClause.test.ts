import { describe, it, expect } from "vitest";
import { QueryBuilder } from "../../../src/builder/QueryBuilder";

describe("GroupByClause", () => {
  describe("Single column grouping", () => {
    it("groups by single column", () => {
      const builder = new QueryBuilder();
      builder.groupBy("category");
      const query = builder.build();
      expect(query.$group).toBe("category");
    });

    it("groups by single column as string", () => {
      const builder = new QueryBuilder();
      builder.groupBy("status");
      const query = builder.build();
      expect(query.$group).toBe("status");
    });
  });

  describe("Multiple column grouping", () => {
    it("groups by multiple columns", () => {
      const builder = new QueryBuilder();
      builder.groupBy(["category", "status"]);
      const query = builder.build();
      expect(query.$group).toBe("category,status");
    });

    it("groups by three columns", () => {
      const builder = new QueryBuilder();
      builder.groupBy(["category", "status", "year"]);
      const query = builder.build();
      expect(query.$group).toBe("category,status,year");
    });
  });

  describe("Validation of grouped columns", () => {
    it("handles column names with underscores", () => {
      const builder = new QueryBuilder();
      builder.groupBy("user_id");
      const query = builder.build();
      expect(query.$group).toBe("user_id");
    });

    it("handles column names with special characters when quoted", () => {
      const builder = new QueryBuilder();
      builder.groupBy('"column name"');
      const query = builder.build();
      expect(query.$group).toBe('"column name"');
    });
  });
});

