DROP DATABASE IF EXISTS employeetracker_db;
CREATE DATABASE employeetracker_db;


\c employeetracker_db;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
id SERIAL PRIMARY KEY,
department_name VARCHAR(255) NOT NULL
);

DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
id SERIAL PRIMARY KEY,
title VARCHAR(255),
salary DECIMAL(10,2),
department_id INT,
FOREIGN KEY (department_id)
REFERENCES departments(id)
ON DELETE SET NULL
);

DROP TABLE IF EXISTS employee;

CREATE TABLE employee (
id SERIAL PRIMARY KEY,
first_name VARCHAR(30) NOT NULL,
last_name VARCHAR(30) NOT NULL,
role_id INT,
manager_id INT NOT NULL
);


