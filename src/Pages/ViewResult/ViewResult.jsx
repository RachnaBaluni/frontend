import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import styles from "./ViewResult.module.css";
import { toast } from "sonner";

/* ================= MATCH ================= */
const Match = ({
  team,
  roundIndex,
  matchId,
  slotType,
  opponentTeam,
  onUpdateMatch,
  matchWinnerId,
}) => {
  let teamDisplayName;

  if (!team) teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  else {
    teamDisplayName = `${team.partner1?.name || "Unknown"} ${
      team.partner2 ? `& ${team.partner2?.name}` : ""
    }`;
  }

  const isWinner = team && matchWinnerId && team._id === matchWinnerId;
  const isLoser =
    team && matchWinnerId && opponentTeam && opponentTeam._id === matchWinnerId;

  const handleClick = async () => {
    if (!team) return;

    await onUpdateMatch(matchId, {
      Winner: team._id,
      Status: "Completed",
    });
  };

  return (
    <div
      className={`${styles.matchSlot} ${isWinner ? styles.winner : ""} ${
        isLoser ? styles.loser : ""
      }`}
      onClick={handleClick}
    >
      <div className={styles.teamName}>{teamDisplayName}</div>
    </div>
  );
};

/* ================= ROUND ================= */
const Round = memo(({ title, matches, roundIndex, onUpdateMatch }) => {
  return (
    <div className={styles.roundContainer}>
      <h2 className={styles.roundTitle}>{title}</h2>

      {matches.map((m) => (
        <div key={m._id} className={styles.matchPair}>
          <div className={styles.matchNumber}>Match {m.Match_number}</div>

          <Match
            team={m.Team1}
            opponentTeam={m.Team2}
            roundIndex={roundIndex}
            matchId={m._id}
            slotType="Team1"
            matchWinnerId={m.Winner}
            onUpdateMatch={onUpdateMatch}
          />

          <div className={styles.vsSeparator}>V/S</div>

          <Match
            team={m.Team2}
            opponentTeam={m.Team1}
            roundIndex={roundIndex}
            matchId={m._id}
            slotType="Team2"
            matchWinnerId={m.Winner}
            onUpdateMatch={onUpdateMatch}
          />
        </div>
      ))}
    </div>
  );
});

/* ================= MAIN ================= */
const ViewResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);

  const fetchEvents = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/events`
    );
    setEvents(res.data.data);
    setSelectedEvent(res.data.data[0]?._id);
  };

  const fetchDraws = async () => {
    if (!selectedEvent) return;

    const res = await axios.get(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${selectedEvent}`
    );
    setDraws(res.data.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [selectedEvent]);

  const handleUpdateMatch = async (id, data) => {
    await axios.put(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/nissan-draws/${id}`,
      data
    );
    fetchDraws();
  };

  const rounds = Object.values(
    draws.reduce((acc, d) => {
      if (!acc[d.Stage]) acc[d.Stage] = [];
      acc[d.Stage].push(d);
      return acc;
    }, {})
  );

  return (
    <div className={styles.manageResultContainer}>
      <h1>Manage Results</h1>

      {/* EVENT BUTTONS */}
      <div className={styles.eventFilterButtons}>
        {events.map((e) => (
          <button
            key={e._id}
            onClick={() => setSelectedEvent(e._id)}
            className={`${styles.filterButton} ${
              selectedEvent === e._id ? styles.active : ""
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* BRACKET */}
      <div className={styles.bracketContainer}>
        {rounds.map((r, i) => (
          <Round
            key={i}
            title={`Round ${i + 1}`}
            matches={r}
            roundIndex={i}
            onUpdateMatch={handleUpdateMatch}
          />
        ))}
      </div>
    </div>
  );
};

export default ViewResult;