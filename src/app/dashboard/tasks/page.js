"use client";

import React, { useState } from "react";
import styles from "./tasks.module.css";

const MOCK_TASKS = [
  { id: "BRW-101", title: "Implement player movement controller", type: "Task", status: "In Progress", priority: "High", assignee: "You", project: "Platformer Alpha" },
  { id: "BRW-102", title: "Design main menu UI mockups", type: "Task", status: "To Do", priority: "Medium", assignee: "Unassigned", project: "Platformer Alpha" },
  { id: "BRW-103", title: "Fix camera jitter on slopes", type: "Bug", status: "In Progress", priority: "High", assignee: "You", project: "Platformer Alpha" },
  { id: "BRW-104", title: "Add sound effects for jump and land", type: "Task", status: "To Do", priority: "Low", assignee: "Unassigned", project: "Platformer Alpha" },
  { id: "BRW-105", title: "Create first playable level blockout", type: "Story", status: "Done", priority: "High", assignee: "You", project: "Platformer Alpha" },
  { id: "BRW-106", title: "Integrate dialogue system with Flow", type: "Task", status: "To Do", priority: "Medium", assignee: "Unassigned", project: "Platformer Alpha" },
  { id: "BRW-107", title: "Optimize foliage LOD for console", type: "Task", status: "In Progress", priority: "Medium", assignee: "You", project: "Platformer Alpha" },
  { id: "BRW-108", title: "Character animation: idle and run cycles", type: "Story", status: "Done", priority: "High", assignee: "You", project: "Platformer Alpha" },
];

export default function TasksPage() {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("list"); // 'list' | 'board'

  const tasksByStatus = {
    "To Do": MOCK_TASKS.filter((t) => t.status === "To Do"),
    "In Progress": MOCK_TASKS.filter((t) => t.status === "In Progress"),
    Done: MOCK_TASKS.filter((t) => t.status === "Done"),
  };

  const priorityClass = (p) => {
    if (p === "High") return styles.priorityHigh;
    if (p === "Medium") return styles.priorityMedium;
    return styles.priorityLow;
  };

  const typeClass = (t) => {
    if (t === "Bug") return styles.typeBug;
    if (t === "Story") return styles.typeStory;
    return styles.typeTask;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My tasks</h1>
          <p className={styles.subtitle}>Connect JIRA to sync your game dev backlog (coming soon)</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.connectButton} disabled>
            Connect JIRA
          </button>
          <div className={styles.viewToggle}>
            <button
              className={view === "list" ? styles.viewActive : ""}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              List
            </button>
            <button
              className={view === "board" ? styles.viewActive : ""}
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
            >
              Board
            </button>
          </div>
        </div>
      </header>

      <div className={styles.filters}>
        {["all", "To Do", "In Progress", "Done"].map((f) => (
          <button
            key={f}
            className={filter === f ? styles.filterActive : styles.filterBtn}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {view === "list" && (
        <div className={styles.listWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Summary</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TASKS.filter((t) => filter === "all" || t.status === filter).map((task) => (
                <tr key={task.id} className={styles.row}>
                  <td className={styles.key}>{task.id}</td>
                  <td className={styles.summary}>{task.title}</td>
                  <td><span className={typeClass(task.type)}>{task.type}</span></td>
                  <td><span className={priorityClass(task.priority)}>{task.priority}</span></td>
                  <td>{task.status}</td>
                  <td>{task.assignee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "board" && (
        <div className={styles.board}>
          {["To Do", "In Progress", "Done"].map((status) => (
            <div key={status} className={styles.column}>
              <h3 className={styles.columnTitle}>{status}</h3>
              <div className={styles.cards}>
                {(filter === "all" ? tasksByStatus[status] : filter === status ? MOCK_TASKS.filter((t) => t.status === filter) : []).map((task) => (
                  <div key={task.id} className={styles.card}>
                    <span className={styles.cardKey}>{task.id}</span>
                    <p className={styles.cardTitle}>{task.title}</p>
                    <div className={styles.cardMeta}>
                      <span className={typeClass(task.type)}>{task.type}</span>
                      <span className={priorityClass(task.priority)}>{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className={styles.mockNote}>Mock data for game dev tasks. Connect JIRA to sync your real backlog.</p>
    </div>
  );
}
