const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server is running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT 
          * 
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT 
           *
        FROM 
           todo
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT 
           *
        FROM 
           todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE 
        id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, status)
    VALUES 
        (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;
  let updateTodoQuery = "";

  if (status !== undefined) {
    updateTodoQuery = `
      UPDATE 
          todo
      SET 
          status = '${status}'
      WHERE 
          id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Status Updated");
  } else if (priority !== undefined) {
    updateTodoQuery = `
      UPDATE 
          todo
      SET 
          priority = '${priority}'
      WHERE 
          id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Priority Updated");
  } else if (todo !== undefined) {
    updateTodoQuery = `
      UPDATE 
          todo
      SET 
          todo = '${todo}'
      WHERE 
          id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Todo Updated");
  } else {
    response.status(400).send("Bad Request");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo
    WHERE
        id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
