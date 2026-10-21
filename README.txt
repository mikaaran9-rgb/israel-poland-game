SAME OR DIFFERENT? — ISRAEL × POLAND

A live multiplayer English-language This or That game.

HOST
1. Open the website and choose "I'm the host".
2. Show the 6-digit room code on the Zoom screen.
3. Students open the same website, enter the code, and select Israel or Poland.
4. Press Start game, wait for votes, Reveal results, then Next question.

RUN LOCALLY
1. Install Node.js 18+.
2. In the project folder run: npm install
3. Run: npm start
4. Open http://localhost:3000

FOR STUDENTS IN BOTH COUNTRIES
Deploy this Node.js project to a hosting provider that supports WebSocket connections (for example Render as a Node Web Service). Set build command "npm install" and start command "npm start". Share the public HTTPS website URL with all students. A local file or localhost address is not reachable by students in other countries.

DEMO
Click "Try host demo" to preview sample questions and simulated results, without a server room. Real votes are not collected in demo mode.

NOTES
• English-only user interface.
• 15 built-in questions.
• Anonymous voting; results shown only after host reveals them.
• One vote per connection per question.
• Participants who refresh are treated as new connections and must rejoin; in-memory rooms disappear if the server restarts.
• The host's tab must stay connected during the game.
