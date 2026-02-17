import styles from './CommentsSection.module.css'

export interface CommentsSectionComment {
  author: string
  content: string
  timestamp: string
}

interface CommentsSectionProps {
  comments: CommentsSectionComment[]
}

export function CommentsSection({ comments }: CommentsSectionProps) {
  if (comments.length === 0) {
    return <p className={styles.empty}>No comments yet</p>
  }

  return (
    <ul className={styles.list}>
      {comments.map((comment, index) => (
        <li
          className={styles.item}
          key={`${comment.author}-${comment.timestamp}-${index}`}
        >
          <p className={styles.content}>{comment.content}</p>
          <p className={styles.meta}>
            {comment.author} • {comment.timestamp}
          </p>
        </li>
      ))}
    </ul>
  )
}
