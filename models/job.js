"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs 
 * id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  salary INTEGER CHECK (salary >= 0),
  equity NUMERIC CHECK (equity <= 1.0),
  company_handle VARCHAR(25) NOT NULL
*/

class Job {
     /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle}
   *
   * Throws BadRequestError if job already in database.
   * */
      static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
              `SELECT title
               FROM jobs
               WHERE title = $1 AND company_handle = $2`,
            [title, companyHandle]);
    
        if (duplicateCheck.rows[0])
          throw new BadRequestError(`Duplicate job: ${title}, ${companyHandle}`);
    
        const result = await db.query(
              `INSERT INTO jobs
               (title, salary, equity, company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];
    
        return job;
      }

    /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);
    return jobsRes.rows;
  }  

  /* 
  Filter all jobs by title, minSalary, and/or hasEquity 
  Returns [{id, title, salary, equity, company_handle}, ...]
  */

  static async filterBy(filters){
    // creates initial query to build off of for each filter in query
    let query = `
    SELECT id,
    title,
    salary,
    equity,
    company_handle AS "companyHandle"
    FROM jobs
    
    `;
    const { title, minSalary, hasEquity } = filters;
    const whereClause = [];
    const values = [];
    
    //checks if the following filters were in query, if so: adds values to array and adds the where clause to an array
    if(title) {
      values.push(`%${title}%`)
      whereClause.push(`title ILIKE $${values.length}`)
    }

    if(minSalary){
      values.push(minSalary)
      whereClause.push(`salary >= $${values.length}`)
    }

    if(hasEquity.toLowerCase() === 'true'){
      whereClause.push(`equity > 0`)
    }

    //joins together the where clause with AND in between each & orders by name
    if(whereClause.length > 0){
      query += " WHERE " + whereClause.join(" AND ")
    }
    
    query += " ORDER BY id"
    //send off the finalized query and return the result
    const jobsRes = await db.query(query, values)
    return jobsRes.rows
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */


   /** Given a job id, return data about job.
   *
   * Returns [{ id, title, salary, equity, companyHandle },...]
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle AS "companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);
    
        const job = jobRes.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
      }
/** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

 static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle",
        });
    const idIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${job}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

   static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id, title, company_handle AS "companyHandle"`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;