import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import styles from "./ViewResult.module.css";
import { toast } from "sonner";

/* ================= MATCH ================= */
const Match = ({
  team,
  roundIndex,
  matchId,
  onUpdateMatch,
  matchWinnerId,
}) => {
  let teamDisplayName;

  if (!team) {
    teamDisplayName = roundIndex === 0 ? "BYE" : "TBD";
  } else {
    teamDisplayName =
      (team.partner1?.name || "Unknown") +
      (team.partner2 ? ` & ${team.partner2?.name}` : "");
  }

  const winnerId = matchWinnerId?._id || matchWinnerId;
  const hasResult = !!winnerId;

  const isWinner =
    hasResult && team && String(team._id) === String(winnerId);

  const isLoser =
    hasResult &&
    ((team && String(team._id) !== String(winnerId)) || !team);

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
      {teamDisplayName}
    </div>
  );
};

/* ================= ROUND ================= */
const Round = memo(({ title, matches, roundIndex, onUpdateMatch }) => {
  return (
    <div className={styles.roundColumn}>
      <h3 className={styles.roundTitle}>{title}</h3>

      <div className={styles.matchesWrapper}>
        {matches.map((m) => (
          <div key={m._id} className={styles.matchPair}>
            <Match
              team={m.Team1}
              roundIndex={roundIndex}
              matchId={m._id}
              matchWinnerId={m.Winner}
              onUpdateMatch={onUpdateMatch}
            />

            <div className={styles.vs}>VS</div>

            <Match
              team={m.Team2}
              roundIndex={roundIndex}
              matchId={m._id}
              matchWinnerId={m.Winner}
              onUpdateMatch={onUpdateMatch}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

/* ================= MAIN ================= */
const ViewResult = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draws, setDraws] = useState([]);

  const API = import.meta.env.VITE_APP_BACKEND_URL;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API}/api/events`);
        setEvents(res.data.data);
        setSelectedEvent(res.data.data[0]?._id);
      } catch {
        toast.error("Events load failed");
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const fetchDraws = async () => {
      try {
        const res = await axios.get(
          `${API}/api/nissan-draws/${selectedEvent}`
        );
        setDraws(res.data.data);
      } catch {
        toast.error("Draws load failed");
      }
    };

    fetchDraws();
  }, [selectedEvent]);

  const handleUpdateMatch = async (id, data) => {
    await axios.put(`${API}/api/nissan-draws/${id}`, data);
    const res = await axios.get(
      `${API}/api/nissan-draws/${selectedEvent}`
    );
    setDraws(res.data.data);
  };

  /* 🔥 FIXED GROUPING */
  const rounds = Array.from({ length: 5 }, () => []);

  draws.forEach((d) => {
    const index = Number(d.Stage) - 1;
    if (index >= 0 && index < 5) {
      rounds[index].push(d);
    }
  });

  rounds.forEach((r) =>
    r.sort((a, b) => a.Match_number - b.Match_number)
  );

  return (
    <div className={styles.container}>
      <h2>View Results</h2>

      <div className={styles.events}>
        {events.map((e) => (
          <button
            key={e._id}
            onClick={() => setSelectedEvent(e._id)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className={styles.bracket}>
        {rounds.map((r, i) =>
          r.length ? (
            <Round
              key={i}
              title={`Round ${i + 1}`}
              matches={r}
              roundIndex={i}
              onUpdateMatch={handleUpdateMatch}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default ViewResult;