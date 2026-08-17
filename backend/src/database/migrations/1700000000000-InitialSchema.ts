import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for production deployments. Not run automatically by the
 * dev/docker-compose flow — that relies on TypeORM's `synchronize` option
 * (see app.module.ts) for convenience during local development. This
 * migration exists so a production deploy has an explicit, reviewable schema
 * change path via `npm run migration:run`.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "fullname" character varying NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "invoice_status_enum" AS ENUM('Draft', 'Pending', 'Paid')`,
    );

    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "invoice_id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_number" character varying NOT NULL,
        "invoice_reference" character varying,
        "invoice_date" date NOT NULL,
        "due_date" date NOT NULL,
        "currency" character varying(3) NOT NULL,
        "currency_symbol" character varying(5) NOT NULL,
        "description" text,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'Draft',
        "tax_percent" numeric(5,2) NOT NULL DEFAULT 10,
        "customer_fullname" character varying NOT NULL,
        "customer_email" character varying NOT NULL,
        "customer_mobile_number" character varying,
        "customer_address" text,
        "invoice_sub_total" numeric(12,2) NOT NULL,
        "total_tax" numeric(12,2) NOT NULL,
        "total_discount" numeric(12,2) NOT NULL DEFAULT 0,
        "total_amount" numeric(12,2) NOT NULL,
        "total_paid" numeric(12,2) NOT NULL DEFAULT 0,
        "balance_amount" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by" uuid NOT NULL,
        CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("invoice_id"),
        CONSTRAINT "FK_invoices_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_invoice_number" ON "invoices" ("invoice_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_due_date" ON "invoices" ("due_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "invoice_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "rate" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_invoice_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoice_items_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoice_items"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_invoice_number"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "invoice_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
