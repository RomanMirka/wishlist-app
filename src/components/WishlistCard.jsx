import { useEffect, useState } from "react";

export default function WishlistCard({ item, currentUser, pending, onClaim, onDelete, onEdit }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = toSafeHttpUrl(item.image_url);
  const productUrl = toSafeHttpUrl(item.link);
  const isClaimed = Boolean(item.claimed_by);
  const claimedByMe = item.claimed_by === currentUser;
  const priority = getPriority(item.priority);

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <article
      className={`wishlist-card ${isClaimed ? "wishlist-card--claimed" : ""}`}
    >
      <div className="dialog-titlebar">
        <span className="item-title">{item.title}</span>
        <div className="card-actions">
          <button
            type="button"
            className="dialog-icon-button dialog-icon-button--claim"
            aria-label={
              isClaimed ? `Зняти позначку «придбано»: ${item.title}` : `Позначити як придбане: ${item.title}`
            }
            title={
              isClaimed ? 'Зняти позначку «придбано»' : "Позначити як придбане"
            }
            onClick={() => onClaim(item)}
            disabled={pending}
          >
            {isClaimed ? (
              <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4.2 4.2L19 6.8" />
              </svg>
            ) : (
              <svg className="action-icon action-icon--dot" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="dialog-icon-button"
            title="Редагувати"
            aria-label={`Редагувати: ${item.title}`}
            onClick={() => onEdit(item)}
            disabled={pending}
          >
            <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5z" />
              <path d="m13.8 6.7 3.5 3.5" />
            </svg>
          </button>
          <button
            type="button"
            className="dialog-icon-button dialog-icon-button--close"
            aria-label={`Видалити: ${item.title}`}
            title="Видалити"
            onClick={() => onDelete(item)}
            disabled={pending}
          >
            <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>
        </div>
      </div>

      <div className="item-image-container">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="item-image"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="image-placeholder">щось дуже бажане</div>
        )}

        {item.price && (
          <span className="price-badge">{formatPrice(item.price)}</span>
        )}
      </div>

      <div className="wishlist-card-content">
        <span className={`priority-badge priority-badge--${priority.value}`}>
          {priority.label}
        </span>
        {item.note && <p className="item-note">{item.note}</p>}

        <div className="item-links">
          {item.place && <span className="store-label">{item.place}</span>}
          {productUrl && (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="product-link"
            >
              Переглянути ↗
            </a>
          )}
        </div>

        <div className="item-metadata">
          <span>додав(ла): {item.added_by}</span>
          {isClaimed && (
            <span
              className={
                claimedByMe
                  ? "claim-status claim-status--current-user"
                  : "claim-status"
              }
            >
              придбав(ла): {item.claimed_by}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function formatPrice(price) {
  const value = price.trim();
  return /(?:грн|₴|uah)/i.test(value) ? value : `${value} грн`;
}

function toSafeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function getPriority(value) {
  const priorities = {
    very_wanted: { value: "very_wanted", label: "Дуже хочу" },
    want: { value: "want", label: "Хочу" },
    nice_to_have: { value: "nice_to_have", label: "Було б непогано" },
  };
  return priorities[value] ?? priorities.want;
}
