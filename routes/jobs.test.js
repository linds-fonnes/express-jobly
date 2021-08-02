"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
      title: "j1",
      salary: 1200,
      equity: 0.11,
      companyHandle: "c1"
    };
  
    test("ok for admin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(201);
      const id = resp.body.job.id
      expect(resp.body).toEqual({
        job: {
          id,
        title: "j1",
        salary: 1200,
        equity: "0.11",
        companyHandle: "c1"
        }
      });
    });

    test("unauth for nonadmin", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            title: "j1",
            salary: 1200
          })
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            ...newJob,
            companyHandle: "not-a-handle",
          })
          .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(500);
    });
  });

  /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "job",
              salary: 50000,
              equity: "0.3",
              companyHandle: "c4"
            },
            {
              id: expect.any(Number),
              title: "job2",
              salary: 30000,
              equity: "0.5",
              companyHandle: "c4"
            }
          ],
    });
  });

  test("works when filter query strings are added", async function (){
    const resp = await request(app).get("/jobs?title=j&minSalary=40000&hasEquity=true");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "job",
          salary: 50000,
          equity: "0.3",
          companyHandle: "c4"
        }
      ]
    })
  })
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  const newJob = {
    title: "j1",
    salary: 1200,
    equity: 0.11,
    companyHandle: "c1"
  };
  let newJobId;
  test("works for admin", async function () {
    const newJobResp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u2Token}`);
     newJobId = newJobResp.body.job.id  

    const resp = await request(app)
        .patch(`/jobs/${newJobId}`)
        .send({
          title: "job-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "job-new",
        salary: 1200,
        equity: "0.11",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for nonadmin", async function () {
    const newJobResp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u2Token}`);
     newJobId = newJobResp.body.job.id 
    const resp = await request(app)
        .patch(`/jobs/${newJobId}`)
        .send({
          name: "job-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const newJobResp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u2Token}`);
     newJobId = newJobResp.body.job.id
    const resp = await request(app)
        .patch(`/jobs/${newJobId}`)
        .send({
          title: "job-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/000`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });


  test("bad request on invalid data", async function () {
    const newJobResp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u2Token}`);
     newJobId = newJobResp.body.job.id 
    const resp = await request(app)
        .patch(`/jobs/${newJobId}`)
        .send({
          equity: "not-a-num",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  const newJob = {
    title: "j1",
    salary: 1200,
    equity: 0.11,
    companyHandle: "c1"
  };
  let newJobId;
  test("works for admin", async function () {
    const newJobResp = await request(app)
    .post("/jobs")
    .send(newJob)
    .set("authorization", `Bearer ${u2Token}`);
     newJobId = newJobResp.body.job.id 

    const resp = await request(app)
        .delete(`/jobs/${newJobId}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: `${newJobId}` });
  });

  test("unauth for nonadmin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${newJobId}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${newJobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

