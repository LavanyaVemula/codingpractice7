const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Start Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB : Error ${e.message}`);
  }
};

initializeDbAndStartServer();

const convertPlayerDbToResponseDb = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbToResponseDb = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreDbToResponseDb = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            *
        FROM 
           player_details;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDbToResponseDb(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE 
            player_id = ${playerId};
    `;
  const player = await db.get(getSpecificPlayerQuery);
  response.send(convertPlayerDbToResponseDb(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};
    `;
  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
        SELECT 
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;
  const match = await db.get(getSpecificMatchQuery);
  response.send(convertMatchDbToResponseDb(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetailsOfPlayerQuery = `
        Select
            *
        FROM 
            match_details
            NATURAL JOIN
            player_match_score
        WHERE
            player_id = ${playerId};
    `;
  const matchDetails = await db.all(getMatchDetailsOfPlayerQuery);
  response.send(
    matchDetails.map((eachMatch) => convertMatchDbToResponseDb(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT
        *
    FROM    
        player_match_score
        NATURAL JOIN
        player_details
    WHERE
        match_id = ${matchId};
  `;
  const playerDetails = await db.all(getPlayerDetailsQuery);
  response.send(
    playerDetails.map((eachPlayer) => convertPlayerDbToResponseDb(eachPlayer))
  );
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsOfPlayer = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_details
        NATURAL JOIN
        player_match_score
    WHERE 
        player_id = ${playerId};
  `;
  const playerMatchDetails = await db.get(getStatisticsOfPlayer);
  response.send(playerMatchDetails);
});

module.exports = app;
