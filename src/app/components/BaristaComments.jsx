'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './BaristaComments.module.css';

export default function BaristaComments({ cardId, boardId }) {
  const { user, authenticatedFetch } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [cardId]);

  const loadComments = async () => {
    try {
      const res = await authenticatedFetch(`/api/barista/cards/${cardId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await authenticatedFetch(`/api/barista/comments`, {
        method: 'POST',
        body: JSON.stringify({
          cardId,
          text: newComment,
          authorId: user.userId,
          context: {
            type: '2D', // TODO: Support '3D' when Testbox is integrated
            worldPosition: null,
            cameraPose: null,
            buildId: null
          }
        })
      });

      if (res.ok) {
        setNewComment('');
        await loadComments();
        // Log activity
        await authenticatedFetch(`/api/barista/activity`, {
          method: 'POST',
          body: JSON.stringify({
            boardId,
            cardId,
            userId: user.userId,
            actionType: 'comment_added'
          })
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await authenticatedFetch(`/api/barista/comments`, {
        method: 'POST',
        body: JSON.stringify({
          cardId,
          parentCommentId,
          text: replyText,
          authorId: user.userId,
          context: {
            type: '2D',
            worldPosition: null,
            cameraPose: null,
            buildId: null
          }
        })
      });

      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  // Build comment tree
  const buildCommentTree = (comments) => {
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      commentMap.set(comment.comment_id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.comment_id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className={styles.commentsContainer}>
      {/* New Comment Input */}
      <div className={styles.newComment}>
        <textarea
          className={styles.commentInput}
          placeholder="Add a comment... Use @username to mention someone"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className={styles.commentActions}>
          <button
            className={styles.buttonSecondary}
            onClick={() => {
              // TODO: Add attachment support
              console.log('Add attachment');
            }}
          >
            📎 Attach
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
          >
            Post Comment
          </button>
        </div>
        {/* TODO: 3D Comment - Add button to "Comment in 3D Testbox" when Testbox is integrated */}
      </div>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {commentTree.length === 0 ? (
          <div className={styles.noComments}>No comments yet. Start the conversation!</div>
        ) : (
          commentTree.map(comment => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyClick={() => setReplyingTo(comment.comment_id)}
              onReplyChange={setReplyText}
              onReplySubmit={() => handleSubmitReply(comment.comment_id)}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyText('');
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, replyingTo, replyText, onReplyClick, onReplyChange, onReplySubmit, onCancelReply }) {
  const { user } = useAuth();
  const isReplying = replyingTo === comment.comment_id;

  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <div className={styles.commentAuthor}>
          <div className={styles.commentAvatar}>
            {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className={styles.commentAuthorName}>
              {comment.author?.name || 'Unknown User'}
            </div>
            <div className={styles.commentTime}>
              {new Date(comment.created_at).toLocaleString()}
              {comment.is_edited && ' (edited)'}
            </div>
          </div>
        </div>
        {/* TODO: Show 3D context badge if context.type === '3D' */}
      </div>

      <div className={styles.commentText}>
        {comment.text}
      </div>

      {/* Attachments */}
      {comment.attachments?.length > 0 && (
        <div className={styles.commentAttachments}>
          {comment.attachments.map((att, i) => (
            <div key={i} className={styles.attachment}>
              {att.type === 'image' && <img src={att.url} alt={att.name} />}
              {att.type === 'video' && <video src={att.url} controls />}
              {att.type === 'log' && (
                <a href={att.url} target="_blank" rel="noopener noreferrer">
                  📄 {att.name}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mentions */}
      {comment.mentioned_user_ids?.length > 0 && (
        <div className={styles.commentMentions}>
          Mentioned: {comment.mentioned_user_ids.join(', ')}
        </div>
      )}

      {/* Reply Button */}
      <button className={styles.replyButton} onClick={onReplyClick}>
        Reply
      </button>

      {/* Reply Input */}
      {isReplying && (
        <div className={styles.replyInput}>
          <textarea
            className={styles.commentInput}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            rows={2}
          />
          <div className={styles.commentActions}>
            <button className={styles.buttonSecondary} onClick={onCancelReply}>
              Cancel
            </button>
            <button
              className={styles.buttonPrimary}
              onClick={onReplySubmit}
              disabled={!replyText.trim()}
            >
              Reply
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              replyingTo={replyingTo}
              replyText={replyText}
              onReplyClick={onReplyClick}
              onReplyChange={onReplyChange}
              onReplySubmit={onReplySubmit}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
