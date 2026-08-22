export default function WishlistCard({ item, currentUser, onClaim, onDelete }) {
  const isClaimed = Boolean(item.claimed_by)
  const claimedByMe = item.claimed_by === currentUser

  return (
    <article className={`wishlist-card ${isClaimed ? 'wishlist-card--claimed' : ''}`}>
      <div className="dialog-titlebar">
        <span className="item-title">
          {item.title}
        </span>
        <div className="card-actions">
          <button
            className="dialog-icon-button dialog-icon-button--claim"
            title={isClaimed ? 'Зняти позначку "куплено"' : 'Позначити як куплено'}
            onClick={() => onClaim(item)}
          >
            {isClaimed ? '✓' : '●'}
          </button>
          <button className="dialog-icon-button dialog-icon-button--close" title="Видалити" onClick={() => onDelete(item)}>
            ✕
          </button>
        </div>
      </div>

      <div className="item-image-container">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="item-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="image-placeholder">
            щось дуже бажане
          </div>
        )}

        {item.price && (
          <span className="price-badge">
            {item.price}
          </span>
        )}
      </div>

      <div className="wishlist-card-content">
        {item.note && <p className="item-note">{item.note}</p>}

        <div className="item-links">
          {item.place && (
            <span className="store-label">
              {item.place}
            </span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="product-link"
            >
              переглянути ↗
            </a>
          )}
        </div>

        <div className="item-metadata">
          <span>додав(ла): {item.added_by}</span>
          {isClaimed && (
            <span className={claimedByMe ? 'claim-status claim-status--current-user' : 'claim-status'}>
              куплено: {item.claimed_by}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
