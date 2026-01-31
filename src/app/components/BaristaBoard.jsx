'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CardDetailPanel from './BaristaCardDetailPanel';
import styles from './BaristaBoard.module.css';

// Card type icons
const CARD_TYPE_ICONS = {
  design: '🧠',
  engineering: '🧑‍💻',
  art: '🎨',
  qa: '🧪',
  tech_debt: '🧰'
};

// Priority colors (roast strength)
const PRIORITY_COLORS = {
  low: '#A67C52',
  medium: '#8B5A2B',
  high: '#6B4423',
  espresso_shot: '#4A2C1A',
  double_shot: '#2D1A0F'
};

export default function BaristaBoard({ boardId, projectId }) {
  const { user, authenticatedFetch } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [filters, setFilters] = useState({ assignee: null, tag: null, type: null, priority: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const [boardRes, columnsRes, cardsRes] = await Promise.all([
        authenticatedFetch(`/api/barista/boards/${boardId}`),
        authenticatedFetch(`/api/barista/boards/${boardId}/columns`),
        authenticatedFetch(`/api/barista/boards/${boardId}/cards`)
      ]);

      if (boardRes.ok) setBoard(await boardRes.json());
      if (columnsRes.ok) setColumns(await columnsRes.json());
      if (cardsRes.ok) setCards(await cardsRes.json());
    } catch (error) {
      console.error('Error loading board:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(card => {
    if (filters.assignee && !card.assignee_ids?.includes(filters.assignee)) return false;
    if (filters.tag && !card.tags?.includes(filters.tag)) return false;
    if (filters.type && card.card_type !== filters.type) return false;
    if (filters.priority && card.priority !== filters.priority) return false;
    if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !card.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (!draggedCard) return;

    try {
      const res = await authenticatedFetch(`/api/barista/cards/${draggedCard.card_id}/move`, {
        method: 'POST',
        body: JSON.stringify({ columnId: targetColumnId, position: 0 })
      });

      if (res.ok) {
        await loadBoard();
        // Log activity
        await authenticatedFetch(`/api/barista/activity`, {
          method: 'POST',
          body: JSON.stringify({
            boardId,
            cardId: draggedCard.card_id,
            userId: user.userId,
            actionType: 'card_moved',
            oldValue: { columnId: draggedCard.column_id },
            newValue: { columnId: targetColumnId }
          })
        });
      }
    } catch (error) {
      console.error('Error moving card:', error);
    } finally {
      setDraggedCard(null);
    }
  };

  const getCardsForColumn = (columnId) => {
    return filteredCards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  };

  const getWipCount = (columnId) => {
    return getCardsForColumn(columnId).length;
  };

  const getWipLimit = (columnId) => {
    const column = columns.find(c => c.column_id === columnId);
    return column?.wip_limit;
  };

  if (loading) {
    return <div className={styles.loading}>☕ Loading your café...</div>;
  }

  return (
    <div className={styles.boardContainer}>
      {/* Header */}
      <div className={styles.boardHeader}>
        <div className={styles.boardTitle}>
          <h1>{board?.name || 'Barista Board'}</h1>
          <p className={styles.boardDescription}>{board?.description}</p>
        </div>

        {/* Filters & Search */}
        <div className={styles.boardControls}>
          <input
            type="text"
            placeholder="🔍 Search orders..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value || null })}
          >
            <option value="">All Types</option>
            <option value="design">🧠 Design</option>
            <option value="engineering">🧑‍💻 Engineering</option>
            <option value="art">🎨 Art</option>
            <option value="qa">🧪 QA</option>
            <option value="tech_debt">🧰 Tech Debt</option>
          </select>
          <select
            className={styles.filterSelect}
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value || null })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="espresso_shot">☕ Espresso Shot</option>
            <option value="double_shot">☕☕ Double Shot</option>
          </select>
        </div>
      </div>

      {/* Board */}
      <div className={styles.board}>
        {columns.map((column) => {
          const columnCards = getCardsForColumn(column.column_id);
          const wipCount = getWipCount(column.column_id);
          const wipLimit = getWipLimit(column.column_id);
          const isWipExceeded = wipLimit && wipCount > wipLimit;

          return (
            <div
              key={column.column_id}
              className={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.column_id)}
            >
              <div className={styles.columnHeader} style={{ borderTopColor: column.color }}>
                <h3>{column.name}</h3>
                <div className={styles.columnMeta}>
                  {wipLimit ? (
                    <span className={isWipExceeded ? styles.wipExceeded : styles.wipCount}>
                      {wipCount}/{wipLimit}
                    </span>
                  ) : (
                    <span className={styles.wipCount}>{wipCount}</span>
                  )}
                </div>
              </div>

              <div className={styles.cardsContainer}>
                {columnCards.map((card) => (
                  <Card
                    key={card.card_id}
                    card={card}
                    onDragStart={handleDragStart}
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
                {draggedCard && draggedCard.column_id !== column.column_id && (
                  <div className={styles.dropZone}>Drop here</div>
                )}
              </div>

              <button
                className={styles.addCardButton}
                onClick={() => {
                  // TODO: Open create card modal
                  console.log('Create card in', column.name);
                }}
              >
                + Add Order
              </button>
            </div>
          );
        })}
      </div>

      {/* Card Detail Panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
          onUpdate={loadBoard}
        />
      )}
    </div>
  );
}

function Card({ card, onDragStart, onClick }) {
  const priorityColor = PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.medium;
  const typeIcon = CARD_TYPE_ICONS[card.card_type] || '📋';

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardTypeIcon}>{typeIcon}</span>
        <span
          className={styles.cardPriority}
          style={{ backgroundColor: priorityColor }}
          title={card.priority}
        />
      </div>
      <h4 className={styles.cardTitle}>{card.title}</h4>
      {card.description && (
        <p className={styles.cardDescription}>{card.description.substring(0, 100)}</p>
      )}
      <div className={styles.cardFooter}>
        {card.tags?.slice(0, 2).map((tag, i) => (
          <span key={i} className={styles.cardTag}>{tag}</span>
        ))}
        {card.assignee_ids?.length > 0 && (
          <span className={styles.cardAssignees}>
            👤 {card.assignee_ids.length}
          </span>
        )}
        {card.due_date && (
          <span className={styles.cardDueDate}>
            📅 {new Date(card.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
