const inquirer = require("inquirer");
const { Pool } = require("pg");
const cfonts = require('cfonts');

const pool = new Pool({
    user: "postgres",
    password: "Chinmay@2498",
    host: "localhost",
    database: "employeetracker_db",
    
  });
  
  // Function to connect to the database
async function connectToDatabase() {
    try {
        await pool.connect();
        console.log("Connected to the PostgreSQL database!");
        start();
    } catch (err) {
        console.error("Error connecting to the PostgreSQL database", err);
    }
}

// Call the function to connect
connectToDatabase();

// Function to start the application of CFONT 
const employeeManagerText = cfonts.render('Employee Manager', {
    font: 'block',              // define the font face
    align: 'left',              // define text alignment
    colors: ['white'],          // define all colors (white in this case)
    background: 'transparent',  // define the background color
    letterSpacing: 1,           // define letter spacing
    lineHeight: 1,              // define the line height
    space: false,               // define if the output text should have empty lines on top and on the bottom
    maxLength: '0',             // define how many characters can be on one line
    gradient: false,            // define your two gradient colors
    independentGradient: false, // define if you want to recalculate the gradient for each new line
    transitionGradient: false,  // define if this is a transition between colors directly
    env: 'node'                 // define the environment cfonts is being executed in
}).string;

// Split the text into lines
const lines = employeeManagerText.split('\n');
const maxLength = Math.max(...lines.map(line => line.length));

// Create a dashed border
const border = '-'.repeat(maxLength + 4);

// Print the text with the dashed border
console.log(border);
lines.forEach(line => {
    console.log(`| ${line.padEnd(maxLength, ' ')} |`);
});
console.log(border);

// Function to Start Employee Tracker Application
function start() {
    inquirer
        .prompt({
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View all employees",
                "Add an employee",
                "Update an employee role",
                "View all roles",
                "Add a role",
                "View All departments",
                "Add Department",
                "Quit",
            ],
        })
        .then((answer) => {
            switch (answer.action) {
                case "View all employees":
                    viewAllEmployees();
                    break;
                case "Add an employee":
                    addEmployee();
                    break;
                case "Update an employee role":
                    updateEmployeeRole();
                    break;        
                case "View all roles":
                    viewAllRoles();
                    break;
                case "Add a role":
                    addRole();
                    break;    
                case "View All departments":
                    viewAllDepartments();
                    break;    
                case "Add Department":
                    addDepartment();
                    break;
                case "Quit":
                    pool.end();
                    console.log("Goodbye!");
                    break;
            }
        });
}



// Function to view all employees
function viewAllEmployees() {
    const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, 
    m.first_name || ' ' || m.last_name AS manager_name
    FROM employee e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id;
    `;
    pool.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        // restart the application
        start();
    });
}


// Function to add an employee
function addEmployee() {
    // Retrieve list of roles from the database
    pool.query("SELECT id, title FROM roles", (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        const roles = results.rows.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        // Retrieve list of employees from the database to use as managers
        pool.query(
            'SELECT id, first_name || \' \' || last_name AS name FROM employee',
            (error, results) => {
                if (error) {
                    console.error(error);
                    return;
                }

                const managers = results.rows.map(({ id, name }) => ({
                    name,
                    value: id,
                }));

                // Prompt the user for employee information
                inquirer
                    .prompt([
                        {
                            type: "input",
                            name: "firstName",
                            message: "Enter the employee's first name:",
                        },
                        {
                            type: "input",
                            name: "lastName",
                            message: "Enter the employee's last name:",
                        },
                        {
                            type: "list",
                            name: "roleId",
                            message: "Select the employee role:",
                            choices: roles,
                        },
                        {
                            type: "list",
                            name: "managerId",
                            message: "Select the employee manager:",
                            choices: [
                                { name: "None", value: null },
                                ...managers,
                            ],
                        },
                    ])
                    .then((answers) => {
                        // Insert the employee into the database
                        const sql =
                            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)";
                        const values = [
                            answers.firstName,
                            answers.lastName,
                            answers.roleId,
                            answers.managerId,
                        ];
                        pool.query(sql, values, (error) => {
                            if (error) {
                                console.error(error);
                                return;
                            }

                            console.log("Employee added successfully");
                            start();
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        );
    });
}



// function to update an employee role
function updateEmployeeRole() {
    const queryEmployees =
        "SELECT employee.id, employee.first_name, employee.last_name, roles.title FROM employee LEFT JOIN roles ON employee.role_id = roles.id";
    const queryRoles = "SELECT * FROM roles";
    
    pool.query(queryEmployees, (err, resEmployees) => {
        if (err) throw err;
        const employees = resEmployees.rows; // Accessing the rows
        
        pool.query(queryRoles, (err, resRoles) => {
            if (err) throw err;
            const roles = resRoles.rows; // Accessing the rows
            
            inquirer
                .prompt([
                    {
                        type: "list",
                        name: "employee",
                        message: "Select the employee to update:",
                        choices: employees.map(
                            (employee) =>
                                `${employee.first_name} ${employee.last_name}`
                        ),
                    },
                    {
                        type: "list",
                        name: "role",
                        message: "Select the new role:",
                        choices: roles.map((role) => role.title),
                    },
                ])
                .then((answers) => {
                    const employee = employees.find(
                        (employee) =>
                            `${employee.first_name} ${employee.last_name}` ===
                            answers.employee
                    );
                    const role = roles.find(
                        (role) => role.title === answers.role
                    );
                    const query =
                        "UPDATE employee SET role_id = $1 WHERE id = $2";
                    pool.query(
                        query,
                        [role.id, employee.id],
                        (err, res) => {
                            if (err) throw err;
                            console.log(
                                `Updated ${employee.first_name} ${employee.last_name}'s role to ${role.title} in the database!`
                            );
                            // restart the application
                            start();
                        }
                    );
                });
        });
    });
}

// function to view all roles
function viewAllRoles() {
    const query = "SELECT roles.title, roles.id, departments.department_name, roles.salary from roles join departments on roles.department_id = departments.id";
    pool.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        // restart the application
        start();
    });
}

//function to add roles 
function addRole() {
    const query = "SELECT * FROM departments";
    pool.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    type: "input",
                    name: "title",
                    message: "Enter the title of the new role:",
                },
                {
                    type: "input",
                    name: "salary",
                    message: "Enter the salary of the new role:",
                },
                {
                    type: "list",
                    name: "department",
                    message: "Select the department for the new role:",
                    choices: res.rows.map(
                        (department) => department.department_name
                    ),
                },
            ])
            .then((answers) => {
                const department = res.rows.find(
                    (department) => department.department_name === answers.department
                );
                const query = "INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)";
                pool.query(
                    query,
                    [answers.title, answers.salary, department.id],
                    (err, res) => {
                        if (err) throw err;
                        console.log(
                            `Added role ${answers.title} with salary ${answers.salary} to the ${answers.department} department in the database!`
                        );
                        // restart the application
                        start();
                    }
                );
            });
    });
}



function viewAllDepartments() {
    const query = "SELECT * FROM departments";
    pool.query(query, (err, res) => {
        if (err) throw err;
        console.table(res.rows);
        // restart the application
        start();
    });
}



// function to add a department
function addDepartment() {
    inquirer
        .prompt({
            type: "input",
            name: "name",
            message: "Enter the name of the new department:",
        })
        .then((answer) => {
            const query = `INSERT INTO departments (department_name) VALUES ($1)`;
            const values = [answer.name];
            
            pool.query(query, values, (err, res) => {
                if (err) throw err;
                console.log(`Added department ${answer.name} to the database!`);
                // Restart the application
                start();
            });
        });
}


// close the connection when the application exits
process.on("Quit", () => {
    pool.end();
});





