import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.uuid('session_id').notNullable();
    table.string('fullName').notNullable();
    table.string('username').notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
  });

  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary();
    table.integer('userId').unsigned().notNullable();
    table.foreign('userId').references('users.id');
    table.string('name').notNullable();
    table.string('description').notNullable();
    table.dateTime('dateAndTime').notNullable();
    table.boolean('isDietMeal').notNullable();
   });

}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('meals');
  await knex.schema.dropTableIfExists('users');
}

