/*********************************************************************************
 *  WEB700 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Mahbubul Hasan Student ID: 161258215 Date: 3/05/2023
 * Cyclic: https://outstanding-cyan-octopus.cyclic.app/students
 *
 ********************************************************************************/
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require("path");
var cd = require("./modules/collegeData.js");
var expressHBS = require('express-handlebars');


// engine
app.engine('hbs', expressHBS.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
      navLink: function (url, options) {
          return '<li' +
              ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
              '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function (lvalue, rvalue, options) {
          if (arguments.length < 3)
              throw new Error("Handlebars Helper equal needs 2 parameters");
          if (lvalue != rvalue) {
              return options.inverse(this);
          } else {
              return options.fn(this);
          }
      }


  }
}));



// specify the 'view engine' -> hbs
app.set('view engine', 'hbs');


// navigation bar 
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  next();
});


// Add the middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET /students
app.get("/students", async (req, res) => {
  try {

      if (req.query.course) {
          const course = parseInt(req.query.course);
          if (isNaN(course) || course < 1 || course > 7) {
              throw new Error('Invalid course number');
          }
          const students = await cd.getStudentsByCourse(course);
          res.render("students", { students });
      } else {
          const students = await cd.getAllStudents();
          res.render("students", { students });
      }
  } catch (err) {
      res.render("students", { message: 'no results' });
  }
});


// GET /tas
app.get("/tas", async (req, res) => {
  try {
    // get and show all managers using our getTAs() function
    const managers = await cd.getTAs();
    res.json(managers);
  } catch (error) {
    // show 'no result' message, in case of no data collected
    res.json({ message: "no result" });
  }
});

// GET /courses
app.get("/courses", async (req, res) => {
  try {
      const courses = await cd.getCourses();
      res.render("courses", { courses });
  } catch (err) {
      res.render("courses", { message: "no results" });
  }
});

// GET /course/var
app.get("/course/:Cid", async (req, res) => {
  try {
      const num = parseInt(req.params.Cid);
      const course = await cd.getCourseById(num);
      res.render("course", { course: course });
  } catch (err) {
      res.render("course", { message: "no results" });
  }
});

// GET /student/num
app.get("/student/:num", async (req, res) => {
  try {
      const num = parseInt(req.params.num);
      if (isNaN(num) || num < 1) {
          throw new Error('Invalid student number');
      }
      const student = await cd.getStudentByNum(num);
      res.render("student", { student: student })
      //res.json(student);
  } catch (err) {
      const student = {}
      student.firstName = ''
      student.lastName = ''
      res.status(500).render("student", { student: student });
  }
});

// setup a 'route' to listen on the default url path
// GET / 'home'
app.get("/", (req, res) => {
  res.render("home");
});

// GET /about
app.get("/about", (req, res) => {
  res.render("about");
});

// GET /htmlDemo
app.get("/htmlDemo", (req, res) => {
  res.render("htmlDemo");
});

app.get("/students/add", (req, res) => {
  res.render("addStudent");
});

// Post route for adding a student
app.post("/students/add", function (req, res) {
  // Get student data from req.body
  const studentData = req.body;

  // Call addStudent function with studentData
  cd.addStudent(studentData)
    .then(function () {
      // Redirect to /students on successful resolution
      res.redirect("/students");
    })
    .catch(function (error) {
      // Handle error
      console.log(error);
      res.send("Error adding student");
    });
});

//Post route for updating a student
app.post("/student/update", async (req, res) => {
  const updStudent = req.body;
  await cd.updateStudent(updStudent).then(() => res.redirect("/students"))
      .catch(error => {
          console.error(error);
          res.status(500).send("Failed");
      });
});

// 'No matching route' if user input wrong URL path we send him a  status 404 'Page Not Found' message
app.use(function (req, res, next) {
  res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
cd.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on port: " + HTTP_PORT);
    });
  })
  .catch((error) => {
    console.error(`Error initializing data: ${error}`);
  });
