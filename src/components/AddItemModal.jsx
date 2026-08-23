import { useState } from 'react'

const empty = { title: '', price: '', place: '', link: '', image_url: '', note: '' }

export default function AddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

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
    <div className="add-item-modal">
      <div className="add-item-dialog">
        <div className="dialog-titlebar">
          <span className="dialog-title">Новий товар</span>
          <button className="dialog-icon-button dialog-icon-button--close" onClick={onClose} title="Закрити">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-item-form">
          <div className="form-fields">
            <Field label="Назва товару *">
              <input
                autoFocus
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
                  placeholder="напр. 2500"
                  className="form-input"
                />
              </Field>
              <Field label="Де продається">
                <input
                  value={form.place}
                  onChange={update('place')}
                  placeholder="напр. Rozetka"
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Посилання на товар">
              <input
                value={form.link}
                onChange={update('link')}
                placeholder="https://..."
                className="form-input"
              />
            </Field>

            <Field label="Посилання на фото">
              <input
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
              className="secondary-button"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary-button save-item-button"
            >
              {saving ? 'Зберігаю…' : 'Додати до списку'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
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
