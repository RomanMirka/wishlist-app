import { useEffect, useState } from 'react'

const empty = { title: '', price: '', place: '', link: '', image_url: '', note: '', priority: 'want' }

export default function AddItemModal({ onClose, onSave, initialItem, title = 'Новий товар', submitLabel = 'Додати до списку' }) {
  const [form, setForm] = useState(initialItem ? toForm(initialItem) : empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => {
    setForm(initialItem ? toForm(initialItem) : empty)
    setError('')
  }, [initialItem])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Вкажіть назву товару')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Не вдалося зберегти')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-item-modal" role="presentation">
      <div className="add-item-dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title">
        <div className="dialog-titlebar">
          <span id="item-dialog-title" className="dialog-title">{title}</span>
          <button type="button" className="dialog-icon-button dialog-icon-button--close" onClick={onClose} title="Закрити" disabled={saving}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form" aria-busy={saving}>
          <div className="form-fields">
            <Field label="Назва товару *">
              <input
                autoFocus
                maxLength={160}
                value={form.title}
                onChange={update('title')}
                placeholder="напр. Кавоварка Delonghi"
                className="form-input"
              />
            </Field>

            <div className="form-row">
              <Field label="Ціна">
                <input
                  value={form.price}
                  onChange={update('price')}
                  inputMode="decimal"
                  maxLength={60}
                  placeholder="напр. 2500"
                  className="form-input"
                />
              </Field>
              <Field label="Де продається">
                <input
                  value={form.place}
                  maxLength={100}
                  onChange={update('place')}
                  placeholder="напр. Rozetka"
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Пріоритет">
              <select
                value={form.priority}
                onChange={update('priority')}
                className="form-input"
              >
                <option value="very_wanted">Дуже хочу</option>
                <option value="want">Хочу</option>
                <option value="nice_to_have">Було б непогано</option>
              </select>
            </Field>

            <Field label="Посилання на товар">
              <input
                type="url"
                maxLength={2_000}
                value={form.link}
                onChange={update('link')}
                placeholder="https://..."
                className="form-input"
              />
            </Field>

            <Field label="Посилання на фото">
              <input
                type="url"
                maxLength={2_000}
                value={form.image_url}
                onChange={update('image_url')}
                placeholder="https://..."
                className="form-input"
              />
            </Field>

            <Field label="Нотатка">
              <textarea
                value={form.note}
                onChange={update('note')}
                rows={2}
                maxLength={1_000}
                placeholder="колір, розмір, чому хочеш саме це..."
                className="form-textarea"
              />
            </Field>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="secondary-button"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-button save-item-button"
            >
              {saving ? 'Зберігаю…' : submitLabel}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

function toForm(item) {
  return {
    title: item.title ?? '', price: item.price ?? '', place: item.place ?? '',
    link: item.link ?? '', image_url: item.image_url ?? '', note: item.note ?? '',
    priority: item.priority ?? 'want',
  }
}

function Field({ label, children }) {
  return (
    <label className="form-field">
      <span className="field-label">
        {label}
      </span>
      {children}
    </label>
  )
}
