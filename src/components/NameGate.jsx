import { useState } from "react";

export default function NameGate({ onSubmit, initial }) {
  const [name, setName] = useState(initial ?? "");

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="name-gate" role="presentation">
      <form onSubmit={submit} className="name-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="name-gate-title">
        <div className="dialog-titlebar">
          <span id="name-gate-title" className="dialog-title">Хто зайшов?</span>
        </div>
        <div className="dialog-content">
          <p className="dialog-description">
            Введіть ваше ім'я — так партнер побачить, хто що додав чи купив.
          </p>
          <input
            autoFocus
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Твоє ім'я"
            className="form-input"
          />
          <button type="submit" className="primary-button name-gate-button">
            Увійти
          </button>
        </div>
      </form>
    </div>
  );
}
