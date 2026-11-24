import { useStudentSettingsPageLogic } from './StudentSettingsPage.logic'

export default function StudentSettingsPage() {
  const { darkMode, setDarkMode, profile, notifications, passwords, setPasswords, message, setMessage, deviceMessage, navigation, updateProfile, updateNotification, handleSaveProfile, handlePasswordUpdate, handleDeviceCheck } = useStudentSettingsPageLogic();

  return (
    <div className={`student-settings-layout ${darkMode ? "dark-mode" : ""}`}>

      {/* SIDEBAR */}
      <aside className="student-settings-sidebar">

        <div className="student-settings-brand">
          <img
            src="/anticopia-logo.png"
            alt="Anticopia"
            className="student-settings-logo"
          />
          <span>Anticopia</span>
        </div>

        <nav className="student-settings-navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`student-settings-nav-link ${
                item.label === "Settings" ? "active" : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="student-settings-sidebar-bottom">
          <button
            type="button"
            className="student-settings-sidebar-action"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Light mode" : "Light / dark"}
          </button>

          <a
            href="/signin"
            className="student-settings-sidebar-action"
          >
            Sign out
          </a>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="student-settings-main">

        <header className="student-settings-header">
          <h1>Profile and settings</h1>
          <p>Manage your account.</p>
        </header>

        <div className="student-settings-grid">

          {/* PROFILE */}
          <section className="student-settings-card">
            <h2>Profile</h2>

            <form onSubmit={handleSaveProfile}>

              <div className="student-settings-field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={(e) =>
                    updateProfile("firstName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={(e) =>
                    updateProfile("lastName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="email">School email</label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    updateProfile("email", e.target.value)
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="student-settings-primary-button"
              >
                Save changes
              </button>

            </form>
          </section>

          {/* CHANGE PASSWORD */}
          <section className="student-settings-card">
            <h2>Change password</h2>

            <form onSubmit={handlePasswordUpdate}>

              <div className="student-settings-field">
                <label htmlFor="currentPassword">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords((previous) => ({
                      ...previous,
                      current: e.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="newPassword">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwords.new}
                  onChange={(e) =>
                    setPasswords((previous) => ({
                      ...previous,
                      new: e.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                className="student-settings-secondary-button"
              >
                Update password
              </button>

            </form>
          </section>

          {/* NOTIFICATIONS */}
          <section className="student-settings-card">
            <h2>Notifications</h2>

            <div className="student-settings-checkboxes">

              <label className="student-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notifications.examUpdates}
                  onChange={() =>
                    updateNotification("examUpdates")
                  }
                />
                <span>Email me about exam updates</span>
              </label>

              <label className="student-settings-checkbox">
                <input
                  type="checkbox"
                  checked={notifications.examReminders}
                  onChange={() =>
                    updateNotification("examReminders")
                  }
                />
                <span>Remind me before exams</span>
              </label>

            </div>
          </section>

          {/* DEVICE CHECK */}
          <section className="student-settings-card">
            <h2>Device check</h2>

            <p className="student-settings-description">
              Use a desktop browser, allow screen sharing,
              and keep fullscreen on during exams.
            </p>

            <button
              type="button"
              className="student-settings-secondary-button"
              onClick={handleDeviceCheck}
            >
              Run device check
            </button>

            {deviceMessage && (
              <div
                className="student-settings-device-result"
                role="status"
              >
                {deviceMessage}
              </div>
            )}

          </section>

        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div
            className="student-settings-message"
            role="status"
          >
            {message}
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
