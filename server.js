// Import necessary modules for server creation
const express = require("express");
const fs = require("fs");
const bp = require("body-parser");
const app = express();
const port = process.env.port || 3333;
let tickets = {
	tickets: [],
};
tickets = JSON.stringify(tickets);
// Render static files such as images,CSS and JS from "public" folder.
app.use(express.static("public"));

// Render HTML file when "/index.html" is requested in URL.
app.use("/index(.html)?", express.static(__dirname + "/public"));

// Transform JSON input into Javascript-accessible variables
app.use(bp.json());

/* Transform URL encoded request into Javascript-accessible variables under request.body
 * body-parser's extended property is set to false to make sure it only accepts strings and arrays.
 */
app.use(bp.urlencoded({ extended: false }));

// Load HTML file when server is loaded without any request.
app.get("/", (request, response) => {
	response.sendFile("index.html");
});

/* Validate username of the user when user logs in by checking if the user is already registered.
 * If the person is not an existing user return a message asking the person to register.
 * If the person is an existing user validate username with password.
 * If successful return success message otherwise return error message.
 */
app.post("/login", (request, response) => {
	let userList = fs.readFileSync("users.json", "utf-8");
	userList = JSON.parse(userList);
	if (request.body.username in userList) {
		if (request.body.password === userList[request.body.username])
			response.json(request.body);
		else {
			response.status(410);
			response.json({ Error: "Invalid Password" });
		}
	} else {
		response.status(411);
		response.json({ Error: "User not found" });
	}
});

/* Add the name of the new user when a person fills and submits the registration form.
 * Create a new json file in the name of the user to store their tickets
 */
app.post("/register", (request, response) => {
	let userList = fs.readFileSync("users.json", "utf-8");
	userList = JSON.parse(userList);
	if (request.body.newusername.toLowerCase() == "admin") {
		response.status(412).send({ message: "Invalid username" });
	} else if (request.body.newusername in userList) {
		response.status(413).send({ message: "Name already in use" });
	} else {
		userList[request.body.newusername] = request.body.newpassword;
		userList = JSON.stringify(userList);
		fs.writeFileSync("./users.json", userList, "utf-8");
		fs.writeFileSync(`./${request.body.newusername}.json`, tickets, "utf-8");
		response.status(200).send({ message: "Registered Successfully" });
	}
});

/* Update the ticket submitted by a user in his file as well as admin's file.
 *  Add ticketNo key to the ticket object to identify a ticket uniquely.
 */
app.post("/raiseticket", (request, response) => {
	let user = fs.readFileSync(`${request.body.name}.json`, "utf-8");
	let admin = fs.readFileSync(`admin.json`, "utf-8");
	user = JSON.parse(user);
	admin = JSON.parse(admin);
	user.tickets.push(request.body);
	request.body.ticketNo = admin.tickets.length + 1;
	admin.tickets.push(request.body);
	user = JSON.stringify(user);
	admin = JSON.stringify(admin);
	fs.writeFileSync(`${request.body.name}.json`, user, "utf-8");
	fs.writeFileSync(`admin.json`, admin, "utf-8");
	response.json({ message: "Ticket Raised" });
});

/* Send the user's data from their respective json file with tickets.
 */
app.get("/userdata", (request, response) => {
	let user = request.query.user;
	let userData = fs.readFileSync(`./${user}.json`);
	userData = JSON.parse(userData);
	userData = JSON.stringify(userData);
	response.json(userData);
});

/* Change the status of a ticket in both user's and admin's json file
 *  when the admin changes the status of a ticket.
 */
app.post("/changestatus", (request, response) => {
	let admin = fs.readFileSync(`admin.json`, "utf-8");
	admin = JSON.parse(admin);
	let user = fs.readFileSync(
		`${findUser(request.body.ticketNo, admin.tickets)}.json`,
		"utf-8"
	);
	user = JSON.parse(user);
	updateTicketStatus(request.body.ticketNo, user.tickets, request.body.status);
	updateTicketStatus(request.body.ticketNo, admin.tickets, request.body.status);
	user = JSON.stringify(user);
	fs.writeFileSync(
		`${findUser(request.body.ticketNo, admin.tickets)}.json`,
		user,
		"utf-8"
	);
	admin = JSON.stringify(admin);
	fs.writeFileSync(`admin.json`, admin, "utf-8");
	response.json({ message: "Ticket Status Changed" });
});
app.listen(port);

/**
 * Search for a ticket with its ticketNo in a list of tickets and change its status
 *
 * @param {string} ticketNo Unique value to identify a ticket.
 * @param {Array} tickets List of tickets.
 * @param {string} status Updated status of a ticket.
 */
function updateTicketStatus(ticketNo, tickets, status) {
	for (let i = 0; i < tickets.length; i++) {
		if (tickets[i].ticketNo == ticketNo) tickets[i].status = status;
	}
}

/**
 *
 *
 * @param {string} ticketNo Unique value to identify a ticket.
 * @param {Array} tickets List of tickets.
 * @return {string} Username of the ticket raiser
 */
function findUser(ticketNo, tickets) {
	for (let i = 0; i < tickets.length; i++) {
		if (tickets[i].ticketNo == ticketNo) return tickets[i].name;
	}
}
