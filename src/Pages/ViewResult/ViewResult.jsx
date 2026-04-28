import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import styles from "./ViewResult.module.css";

/* ================= MATCH (READ ONLY) ================= */
const Match = ({ team, opponentTeam, matchWinnerId, score, roundIndex }) => {
  const teamDisplayName = !team
    ? roundIndex === 0
      ? "BYE"
      : "TBD"
    : `${team.partner1?.name || ""} ${
        team.partner2 ? `& ${team.partner2?.name}` : ""
      }`;

  const isWinner = team && matchWinnerId === team._id;
  const isLoser =
    team && matchWinnerId && opponentTeam?._id === matchWinnerId;

  return (
    <div
      className={`${styles.matchSlot} ${isWinner ? styles.winner : ""} ${
        isLoser ? styles.loser : ""
      }`}
    >
      <div className={styles.teamName}>{teamDisplayName}</div>

      {/* SCORE DISPLAY ONLY */}
      {team && opponentTeam && (
        <div className={styles.scoreText}>
          {score || "—"}
        </div>
      )}
    </div>
  );
};

/* ================= ROUND ================= */
const Round = memo(({ title, matches }) => {
  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>

      <div className={styles.matchesContainer}>
        {matches.map((m) => {
          const scoreParts = m.Score
            ? m.Score.split(" + ")
            : ["", ""];

          return (
            <div key={m._id} className={styles.matchPair}>
              <div className={styles.matchNumber}>
                Match {m.Match_number}
              </div>

              <Match
                team={m.Team1}
                opponentTeam={m.Team2}
                matchWinnerId={m.Winner?._id}
                score={scoreParts[0]}
                roundIndex={0}
              />

              <div className={styles.vsSeparator}>VS</div>

              <Match
                team={m.Team2}
                opponentTeam={m.Team1}
                matchWinnerId={m.Winner?._id}
                score={scoreParts[1]}
                roundIndex={0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ================= MAIN ================= */
const ViewResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);

  /* FETCH EVENTS */
  useEffect(() => {
    const load = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`
      );
      setEvents(res.data.data);
      setSelectedEvent(res.data.data[0]?._id);
    };
    load();
  }, []);

  /* FETCH DRAWS */
  useEffect(() => {
    if (!selectedEvent) return;

    const load = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${selectedEvent}`
      );
      setDraws(res.data.data);
    };
    load();
  }, [selectedEvent]);

  /* GROUP BY ROUND */
  const rounds = Object.entries(
    draws.reduce((acc, d) => {
      acc[d.Stage] = acc[d.Stage] || [];
      acc[d.Stage].push(d);
      return acc;
    }, {})
  );

  return (
    <div className={styles.manageResultContainer}>
      <h2>Results</h2>

      {/* FILTER */}
      <div className={styles.eventFilterButtons}>
        {events.map((e) => (
          <button
            key={e._id}
            onClick={() => setSelectedEvent(e._id)}
            className={styles.filterButton}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* SCROLL BRACKET */}
      <div className={styles.bracketContainer}>
        {rounds.map(([stage, matches]) => (
          <Round key={stage} title={stage} matches={matches} />
        ))}
      </div>
    </div>
  );
};

export default ViewResult;