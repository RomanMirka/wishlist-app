import { useState } from "react";

export default function NameGate({ onSubmit, initial }) {
  const [name, setName] = useState(initial ?? "");

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="name-gate">
      <form onSubmit={submit} className="name-gate-dialog">
        <div className="dialog-titlebar">
          <span className="dialog-title">Хто зайшов?</span>
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
